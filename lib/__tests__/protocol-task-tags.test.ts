import { describe, expect, it } from "vitest";
import {
  normalizeTaskTagsArray,
  parseProtocolProgressMetaFromTaskTags,
} from "@/lib/growth/protocol-task-tags";

describe("parseProtocolProgressMetaFromTaskTags", () => {
  it("parses explicit protocol_slug and locale", () => {
    expect(
      parseProtocolProgressMetaFromTaskTags([
        "growth",
        "protocol",
        "my-proto",
        "protocol_slug:my-proto",
        "protocol_locale:nl",
        "protocol_week:2",
        "protocol_task:task-abc",
        "protocol_tier:medium",
      ]),
    ).toEqual({
      protocol_slug: "my-proto",
      locale: "nl",
      protocol_task_id: "task-abc",
    });
  });

  it("falls back to slug after protocol marker (legacy missions)", () => {
    expect(
      parseProtocolProgressMetaFromTaskTags([
        "growth",
        "protocol",
        "legacy-slug",
        "protocol_week:1",
        "protocol_task:tid-1",
      ]),
    ).toEqual({
      protocol_slug: "legacy-slug",
      locale: "nl",
      protocol_task_id: "tid-1",
    });
  });

  it("returns null without protocol_task", () => {
    expect(parseProtocolProgressMetaFromTaskTags(["growth", "protocol", "x"])).toBeNull();
  });

  it("parses JSON string task_tags", () => {
    const json = JSON.stringify([
      "growth",
      "protocol",
      "p",
      "protocol_task:z1",
      "protocol_slug:p",
      "protocol_locale:nl",
    ]);
    expect(parseProtocolProgressMetaFromTaskTags(json)).toEqual({
      protocol_slug: "p",
      locale: "nl",
      protocol_task_id: "z1",
    });
  });

  it("normalizeTaskTagsArray coerces non-strings", () => {
    expect(normalizeTaskTagsArray(["a", 1, true])).toEqual(["a", "1", "true"]);
  });
});
