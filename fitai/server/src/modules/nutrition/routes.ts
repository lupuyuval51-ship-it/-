import { Router } from 'express';
import { z } from 'zod';
import { uuid } from '@shared/schemas/common';
import {
  barcodeSchema,
  batchLogSchema,
  copyLogsSchema,
  createLogEntrySchema,
  customFoodSchema,
  foodSearchQuerySchema,
  logSavedMealSchema,
  logTemplateSchema,
  mealTemplateSlugSchema,
  nutritionDayQuerySchema,
  nutritionSuggestionsQuerySchema,
  nutritionSummaryQuerySchema,
  photoAnalysisSchema,
  quickAddSchema,
  saveMealFromDaySchema,
  savedMealSchema,
  updateCustomFoodSchema,
  updateLogEntrySchema,
} from '@shared/schemas/nutrition';
import type {
  CopyLogsResponse,
  DayNutritionDTO,
  DeleteLogEntryResponse,
  FoodAlternativesResponse,
  FoodResponse,
  FoodsResponse,
  FrequentFoodsResponse,
  LogEntriesResponse,
  LogEntryResponse,
  NutritionSuggestionsDTO,
  NutritionSummaryDTO,
  OkResponse,
  PhotoAnalysisDTO,
  SavedMealResponse,
  SavedMealsResponse,
} from '@shared/types';
import { db } from '../../db/pool';
import { authUser, userId } from '../../middleware/context';
import { rateLimit } from '../../middleware/rateLimit';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { dietPreferences, getProfile } from '../profile/repository';
import { lookupBarcode } from './barcode';
import { createUserFood, deleteUserFood, foodAlternatives, listOwnFoods, requireVisibleFood, searchFoods, toFoodDTO, updateUserFood } from './foods';
import { batchLog, copyEntries, createEntry, deleteEntry, frequentFoods, getDay, nutritionSummary, quickAdd, recentFoods, updateEntry, userToday } from './logs';
import { analyzeMealPhoto } from './photo';
import { createSavedMeal, deleteSavedMeal, listSavedMeals, logSavedMeal, saveMealFromDay } from './savedMeals';
import { getSuggestions, logTemplate } from './suggestions';

/** Mounted at /api by app.ts (authenticated). */
export const nutritionRouter = Router();

const idParams = z.object({ id: uuid });
const prefsFor = async (id: string) => dietPreferences(await getProfile(db, id));

// ---------------------------------------------------------------- Foods
// Static paths are registered before `/foods/:id` so they are never parsed as ids.

nutritionRouter.get('/foods/search', async (req, res) => {
  const query = parseQuery(foodSearchQuerySchema, req);
  const id = userId(req);
  const body: FoodsResponse = { foods: await searchFoods(db, id, await prefsFor(id), query) };
  res.json(body);
});

nutritionRouter.get('/foods/mine', async (req, res) => {
  const id = userId(req);
  const prefs = await prefsFor(id);
  const body: FoodsResponse = { foods: (await listOwnFoods(db, id)).map((f) => toFoodDTO(f, id, prefs)) };
  res.json(body);
});

nutritionRouter.get('/foods/barcode/:code', rateLimit({ name: 'barcode', limit: 30, windowMs: 60_000 }), async (req, res) => {
  const { code } = parseParams(z.object({ code: barcodeSchema }), req);
  const id = userId(req);
  const food = await lookupBarcode(db, id, code);
  const body: FoodResponse = { food: toFoodDTO(food, id, await prefsFor(id)) };
  res.json(body);
});

nutritionRouter.post('/foods', async (req, res) => {
  const input = parseBody(customFoodSchema, req);
  const id = userId(req);
  const food = await db.tx((tx) => createUserFood(tx, id, input));
  const body: FoodResponse = { food: toFoodDTO(food, id, await prefsFor(id)) };
  res.status(201).json(body);
});

nutritionRouter.get('/foods/:id', async (req, res) => {
  const { id: foodId } = parseParams(idParams, req);
  const id = userId(req);
  const food = await requireVisibleFood(db, id, foodId);
  const body: FoodResponse = { food: toFoodDTO(food, id, await prefsFor(id)) };
  res.json(body);
});

nutritionRouter.get('/foods/:id/alternatives', async (req, res) => {
  const { id: foodId } = parseParams(idParams, req);
  const id = userId(req);
  const food = await requireVisibleFood(db, id, foodId);
  const body: FoodAlternativesResponse = { alternatives: await foodAlternatives(db, id, await prefsFor(id), food) };
  res.json(body);
});

nutritionRouter.patch('/foods/:id', async (req, res) => {
  const { id: foodId } = parseParams(idParams, req);
  const patch = parseBody(updateCustomFoodSchema, req);
  const id = userId(req);
  const food = await db.tx((tx) => updateUserFood(tx, id, foodId, patch));
  const body: FoodResponse = { food: toFoodDTO(food, id, await prefsFor(id)) };
  res.json(body);
});

nutritionRouter.delete('/foods/:id', async (req, res) => {
  const { id: foodId } = parseParams(idParams, req);
  await deleteUserFood(db, userId(req), foodId);
  const body: OkResponse = { ok: true };
  res.json(body);
});

// ---------------------------------------------------------------- Day, summaries, history

nutritionRouter.get('/nutrition/day', async (req, res) => {
  const { date } = parseQuery(nutritionDayQuerySchema, req);
  const id = userId(req);
  const body: DayNutritionDTO = await getDay(db, id, date ?? (await userToday(db, id)));
  res.json(body);
});

nutritionRouter.get('/nutrition/summary', async (req, res) => {
  const { days, to } = parseQuery(nutritionSummaryQuerySchema, req);
  const body: NutritionSummaryDTO = await nutritionSummary(db, userId(req), days, to);
  res.json(body);
});

nutritionRouter.get('/nutrition/recent', async (req, res) => {
  const body: FrequentFoodsResponse = { foods: await recentFoods(db, userId(req)) };
  res.json(body);
});

nutritionRouter.get('/nutrition/frequent', async (req, res) => {
  const body: FrequentFoodsResponse = { foods: await frequentFoods(db, userId(req)) };
  res.json(body);
});

// ---------------------------------------------------------------- Logging

nutritionRouter.post('/nutrition/logs', async (req, res) => {
  const input = parseBody(createLogEntrySchema, req);
  const id = userId(req);
  const body: LogEntryResponse = await db.tx((tx) => createEntry(tx, id, input));
  res.status(201).json(body);
});

nutritionRouter.post('/nutrition/logs/quick', async (req, res) => {
  const input = parseBody(quickAddSchema, req);
  const id = userId(req);
  const body: LogEntryResponse = await db.tx((tx) => quickAdd(tx, id, input));
  res.status(201).json(body);
});

nutritionRouter.post('/nutrition/logs/copy', async (req, res) => {
  const input = parseBody(copyLogsSchema, req);
  const id = userId(req);
  const body: CopyLogsResponse = await db.tx((tx) => copyEntries(tx, id, input));
  res.status(201).json(body);
});

nutritionRouter.post('/nutrition/logs/batch', async (req, res) => {
  const input = parseBody(batchLogSchema, req);
  const id = userId(req);
  const body: LogEntriesResponse = await db.tx((tx) => batchLog(tx, id, input));
  res.status(201).json(body);
});

nutritionRouter.patch('/nutrition/logs/:id', async (req, res) => {
  const { id: entryId } = parseParams(idParams, req);
  const input = parseBody(updateLogEntrySchema, req);
  const id = userId(req);
  const body: LogEntryResponse = await db.tx((tx) => updateEntry(tx, id, entryId, input));
  res.json(body);
});

nutritionRouter.delete('/nutrition/logs/:id', async (req, res) => {
  const { id: entryId } = parseParams(idParams, req);
  const id = userId(req);
  const body: DeleteLogEntryResponse = { ok: true, day: await db.tx((tx) => deleteEntry(tx, id, entryId)) };
  res.json(body);
});

// ---------------------------------------------------------------- Saved meals

nutritionRouter.get('/nutrition/saved-meals', async (req, res) => {
  const id = userId(req);
  const body: SavedMealsResponse = { meals: await listSavedMeals(db, id, await prefsFor(id)) };
  res.json(body);
});

nutritionRouter.post('/nutrition/saved-meals', async (req, res) => {
  const input = parseBody(savedMealSchema, req);
  const id = userId(req);
  const prefs = await prefsFor(id);
  const body: SavedMealResponse = { meal: await db.tx((tx) => createSavedMeal(tx, id, prefs, input)) };
  res.status(201).json(body);
});

nutritionRouter.post('/nutrition/saved-meals/from-day', async (req, res) => {
  const input = parseBody(saveMealFromDaySchema, req);
  const id = userId(req);
  const prefs = await prefsFor(id);
  const body: SavedMealResponse = { meal: await db.tx((tx) => saveMealFromDay(tx, id, prefs, input)) };
  res.status(201).json(body);
});

nutritionRouter.delete('/nutrition/saved-meals/:id', async (req, res) => {
  const { id: mealId } = parseParams(idParams, req);
  await deleteSavedMeal(db, userId(req), mealId);
  const body: OkResponse = { ok: true };
  res.json(body);
});

nutritionRouter.post('/nutrition/saved-meals/:id/log', async (req, res) => {
  const { id: mealId } = parseParams(idParams, req);
  const input = parseBody(logSavedMealSchema, req);
  const id = userId(req);
  const body: LogEntriesResponse = await db.tx((tx) => logSavedMeal(tx, id, mealId, input));
  res.status(201).json(body);
});

// ---------------------------------------------------------------- Suggestions

nutritionRouter.get('/nutrition/suggestions', async (req, res) => {
  const query = parseQuery(nutritionSuggestionsQuerySchema, req);
  const body: NutritionSuggestionsDTO = await getSuggestions(db, userId(req), query);
  res.json(body);
});

nutritionRouter.post('/nutrition/suggestions/:slug/log', async (req, res) => {
  const { slug } = parseParams(z.object({ slug: mealTemplateSlugSchema }), req);
  const input = parseBody(logTemplateSchema, req);
  const id = userId(req);
  const body: LogEntriesResponse = await db.tx((tx) => logTemplate(tx, id, slug, input));
  res.status(201).json(body);
});

// ---------------------------------------------------------------- Photo analysis

nutritionRouter.post('/nutrition/photo-analysis', rateLimit({ name: 'photo_analysis', limit: 5, windowMs: 60_000 }), async (req, res) => {
  const input = parseBody(photoAnalysisSchema, req);
  const user = authUser(req);
  const body: PhotoAnalysisDTO = await analyzeMealPhoto(user.id, user, await prefsFor(user.id), input);
  res.json(body);
});
