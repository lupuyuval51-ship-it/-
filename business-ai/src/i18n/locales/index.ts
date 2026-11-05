/**
 * Registry of every namespace. A feature adds keys to its own he/<ns>.ts and en/<ns>.ts; it never
 * needs to touch this file. New namespaces must be registered here in both languages.
 */
import heAdvisor from './he/advisor';
import heAuth from './he/auth';
import heBusiness from './he/business';
import heCommon from './he/common';
import heErrors from './he/errors';
import heFinance from './he/finance';
import heHome from './he/home';
import heLaunch from './he/launch';
import heManage from './he/manage';
import heMarketing from './he/marketing';
import heOnboarding from './he/onboarding';
import hePlan from './he/plan';
import heRoadmap from './he/roadmap';
import heSettings from './he/settings';
import enAdvisor from './en/advisor';
import enAuth from './en/auth';
import enBusiness from './en/business';
import enCommon from './en/common';
import enErrors from './en/errors';
import enFinance from './en/finance';
import enHome from './en/home';
import enLaunch from './en/launch';
import enManage from './en/manage';
import enMarketing from './en/marketing';
import enOnboarding from './en/onboarding';
import enPlan from './en/plan';
import enRoadmap from './en/roadmap';
import enSettings from './en/settings';
import type { Locale, Messages } from '../types';

export const he = {
  common: heCommon,
  errors: heErrors,
  auth: heAuth,
  onboarding: heOnboarding,
  home: heHome,
  plan: hePlan,
  roadmap: heRoadmap,
  advisor: heAdvisor,
  finance: heFinance,
  marketing: heMarketing,
  launch: heLaunch,
  manage: heManage,
  business: heBusiness,
  settings: heSettings,
} as const;

export type Resources = typeof he;
export type Namespace = keyof Resources;

const en: Messages<Resources> = {
  common: enCommon,
  errors: enErrors,
  auth: enAuth,
  onboarding: enOnboarding,
  home: enHome,
  plan: enPlan,
  roadmap: enRoadmap,
  advisor: enAdvisor,
  finance: enFinance,
  marketing: enMarketing,
  launch: enLaunch,
  manage: enManage,
  business: enBusiness,
  settings: enSettings,
};

export const resources: Readonly<Record<Locale, Messages<Resources>>> = { he, en };

export const NAMESPACES = Object.keys(he) as Namespace[];
