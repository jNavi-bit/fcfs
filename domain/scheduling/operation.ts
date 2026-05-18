export type OperationKind = "add" | "sub" | "mul" | "div" | "mod" | "pow";

export type OperationSpec = {
  kind: OperationKind;
  left: number;
  right: number;
};

export type OperationResult =
  | { ok: true; value: number }
  | { ok: false; reason: "div_zero" | "mod_zero" | "overflow" };

const OP_LABEL: Record<OperationKind, string> = {
  add: "+",
  sub: "-",
  mul: "*",
  div: "/",
  mod: "%",
  pow: "^",
};

export function formatOperation(spec: OperationSpec): string {
  return `${spec.left} ${OP_LABEL[spec.kind]} ${spec.right}`;
}

export function evaluateOperation(spec: OperationSpec): OperationResult {
  const { kind, left, right } = spec;
  switch (kind) {
    case "add":
      return { ok: true, value: left + right };
    case "sub":
      return { ok: true, value: left - right };
    case "mul":
      return { ok: true, value: left * right };
    case "div":
      if (right === 0) return { ok: false, reason: "div_zero" };
      return { ok: true, value: Math.trunc(left / right) };
    case "mod":
      if (right === 0) return { ok: false, reason: "mod_zero" };
      return { ok: true, value: left % right };
    case "pow": {
      const v = left ** right;
      if (!Number.isFinite(v)) return { ok: false, reason: "overflow" };
      return { ok: true, value: v };
    }
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const KINDS: OperationKind[] = [
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "pow",
];

export function generateRandomOperation(): OperationSpec {
  for (let attempt = 0; attempt < 50; attempt++) {
    const kind = KINDS[randomInt(0, KINDS.length - 1)]!;
    const left = randomInt(1, 20);
    let right = randomInt(1, 20);
    if (kind === "div" || kind === "mod") {
      right = randomInt(1, 20);
      if (right === 0) continue;
    }
    if (kind === "pow") {
      right = randomInt(2, 4);
      if (Math.abs(left ** right) > 1e9) continue;
    }
    const res = evaluateOperation({ kind, left, right });
    if (res.ok) return { kind, left, right };
  }
  return { kind: "add", left: 1, right: 1 };
}
