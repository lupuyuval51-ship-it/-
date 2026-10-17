import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { gameEventSchema } from "@/lib/game/state/events";
import { exceedsJsonDepth, readBodyText } from "@/server/http/body";
import { ApiError } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";

const ORIGIN = "http://localhost:3000";

function post(body: BodyInit | ReadableStream<Uint8Array>, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${ORIGIN}/api/x`, {
    method: "POST",
    headers: { host: "localhost:3000", origin: ORIGIN, "content-type": "application/json", ...headers },
    body,
    duplex: "half",
  } as ConstructorParameters<typeof NextRequest>[1]);
}

/** A chunked upload: no Content-Length, `chunks` pieces of `chunkBytes` JSON-whitespace bytes each. `pulled` counts how much was really read. */
function chunkedBody(chunkBytes: number, chunks: number) {
  const state = { pulled: 0, cancelled: false };
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent++ >= chunks) return controller.close();
      state.pulled += 1;
      controller.enqueue(new Uint8Array(chunkBytes).fill(0x20));
    },
    cancel() {
      state.cancelled = true;
    },
  });
  return { stream, state };
}

const echo = apiRoute({ auth: "none", body: z.object({ a: z.string() }) }, async ({ body }) => ({ echo: body.a }));
const code = async (res: Response) => ((await res.json()) as { error?: { code: string } }).error?.code;

describe("request body limits (apiRoute)", () => {
  it("accepts a normal JSON body and still rejects malformed JSON", async () => {
    const ok = await echo(post(JSON.stringify({ a: "hello" })));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ echo: "hello" });
    const bad = await echo(post("{nope"));
    expect(bad.status).toBe(400);
  });

  it("treats a missing body as an empty object (routes whose body fields are all optional)", async () => {
    const optional = apiRoute({ auth: "none", body: z.object({ restart: z.boolean().optional() }) }, async ({ body }) => ({ restart: body.restart ?? false }));
    const req = new NextRequest(`${ORIGIN}/api/x`, { method: "POST", headers: { host: "localhost:3000", origin: ORIGIN } });
    const res = await optional(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ restart: false });
  });

  it("rejects an oversized CHUNKED upload (no Content-Length) and stops reading it", async () => {
    const { stream, state } = chunkedBody(64 * 1024, 4000); // would be 256 MB if read to the end
    const res = await echo(post(stream));
    expect(res.status).toBe(413);
    expect(await code(res)).toBe("PAYLOAD_TOO_LARGE");
    expect(state.pulled).toBeLessThan(20); // the 256 KiB cap is hit after a handful of chunks
    expect(state.cancelled).toBe(true);
  });

  it("does not trust an understated Content-Length", async () => {
    const { stream } = chunkedBody(64 * 1024, 100);
    const res = await echo(post(stream, { "content-length": "10" }));
    expect(res.status).toBe(413);
  });

  it("rejects a declared oversize body without reading it", async () => {
    const res = await echo(post("{}", { "content-length": String(10 * 1024 * 1024) }));
    expect(res.status).toBe(413);
  });
});

describe("readBodyText", () => {
  it("decodes multi-byte UTF-8 split across chunks and enforces the cap in BYTES", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ t: "שלום עולם" }));
    const split = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(bytes.slice(0, 9)); // cuts a two-byte Hebrew letter in half
        c.enqueue(bytes.slice(9));
        c.close();
      },
    });
    expect(JSON.parse(await readBodyText(post(split), 1000))).toEqual({ t: "שלום עולם" });
    await expect(readBodyText(post("x".repeat(101)), 100)).rejects.toBeInstanceOf(ApiError);
    await expect(readBodyText(post("ש".repeat(60)), 100)).rejects.toMatchObject({ status: 413 }); // 60 characters but 120 bytes
  });
});

describe("JSON nesting depth", () => {
  it("measures depth iteratively", () => {
    expect(exceedsJsonDepth({ a: [{ b: 1 }] }, 3)).toBe(false);
    expect(exceedsJsonDepth({ a: [{ b: 1 }] }, 2)).toBe(true);
    expect(exceedsJsonDepth(1, 1)).toBe(false);
    let deep: unknown = 1;
    for (let i = 0; i < 200_000; i++) deep = [deep]; // far deeper than the stack would allow a recursive walk
    expect(exceedsJsonDepth(deep, 64)).toBe(true);
  });

  it("a hostile deeply nested program answer is a clean 400, never a 500 (and never reaches the schema or the grader)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const events = apiRoute({ auth: "none", body: gameEventSchema }, async ({ body }) => ({ type: body.type }));
    const depth = 6000;
    const nested = '{"t":"repeat","n":2,"body":['.repeat(depth) + '{"t":"move"}' + "]}".repeat(depth);
    const raw = `{"type":"answer","stationId":"s-var1","answer":{"type":"program","program":[${nested}]}}`;
    expect(raw.length).toBeLessThan(256 * 1024);
    const res = await events(post(raw));
    expect(res.status).toBe(400);
    expect(consoleError).not.toHaveBeenCalled(); // nothing "unhandled": it was rejected on purpose
    consoleError.mockRestore();
    // an ordinary answer with a little nesting still works
    const fine = await events(post(JSON.stringify({ type: "answer", stationId: "s-var1", answer: { type: "program", program: [{ t: "repeat", n: 2, body: [{ t: "move" }] }] } })));
    expect(fine.status).toBe(200);
  });
});
