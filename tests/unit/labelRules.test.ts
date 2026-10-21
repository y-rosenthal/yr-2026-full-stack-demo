// Unit tests for the label rules of the create-task-with-ai Edge Function.
// They need no Supabase project and no keys: npx jest tests/unit
import {
  DEFAULT_LABELS,
  chooseLabel,
  existingLabelList,
  normalizeLabel,
} from "../../supabase/functions/_shared/labelRules";

describe("Label rules", () => {
  const existing = existingLabelList(["gardening", "car repair", "work"]);

  test("existing labels are the defaults plus the user's labels, each once", () => {
    expect(existing).toEqual([...DEFAULT_LABELS, "gardening", "car repair"]);
  });

  test("tidies up the AI's reply", () => {
    expect(normalizeLabel('  "Work".\n')).toBe("work");
    expect(normalizeLabel("Label: Home")).toBe("home");
    expect(normalizeLabel("Car   Repair")).toBe("car repair");
    expect(normalizeLabel("pet_care")).toBe("pet-care");
  });

  test("keeps an existing label", () => {
    expect(chooseLabel("work", existing)).toBe("work");
    expect(chooseLabel("Shopping", existing)).toBe("shopping");
    expect(chooseLabel("car repair", existing)).toBe("car repair");
  });

  test("maps labels that mimic an existing label to that label", () => {
    expect(chooseLabel("homes", existing)).toBe("home");
    expect(chooseLabel("my-home", existing)).toBe("home");
    expect(chooseLabel("home stuff", existing)).toBe("home");
    expect(chooseLabel("car-repair", existing)).toBe("car repair");
    expect(chooseLabel("carrepair", existing)).toBe("car repair");
    expect(chooseLabel("car repairs", existing)).toBe("car repair");
    expect(chooseLabel("work tasks", existing)).toBe("work");
  });

  test("accepts a new label that is really new", () => {
    expect(chooseLabel("fitness", existing)).toBe("fitness");
    expect(chooseLabel("pet care", existing)).toBe("pet care");
    // "homework" is one word, not "home" plus something.
    expect(chooseLabel("homework", existing)).toBe("homework");
  });

  test("rejects replies that are not valid labels", () => {
    expect(chooseLabel("", existing)).toBeNull();
    expect(chooseLabel(null, existing)).toBeNull();
    expect(chooseLabel("a very long label for this task", existing)).toBeNull();
    expect(chooseLabel("work/personal", existing)).toBeNull();
    expect(chooseLabel("I suggest: fitness", existing)).toBeNull();
  });
});
