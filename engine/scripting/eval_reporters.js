/**
 * UNIFIVE Scripting - Reporter Evaluation Subsystem
 */
const EvalReporters = {
  evaluateReporterBlock(repBlock, targetItem, resolveFn) {
    if (!repBlock) return 0;
    const bid = repBlock.blockId || repBlock.id;
    const inputs = repBlock.inputs || [];
    const r = (idx, fb = 0) => resolveFn(inputs[idx] !== undefined ? inputs[idx] : fb, targetItem);

    if (bid === "op_add" || bid === "+") return Number(r(0, 0)) + Number(r(1, 0));
    if (bid === "op_subtract" || bid === "-") return Number(r(0, 0)) - Number(r(1, 0));
    if (bid === "op_multiply" || bid === "*") return Number(r(0, 0)) * Number(r(1, 0));
    if (bid === "op_divide" || bid === "/") {
      const d = Number(r(1, 1));
      return d === 0 ? 0 : Number(r(0, 0)) / d;
    }
    if (bid === "op_random") {
      const min = Math.min(Number(r(0, 1)), Number(r(1, 10)));
      const max = Math.max(Number(r(0, 1)), Number(r(1, 10)));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (bid === "op_join") return String(r(0, "")) + String(r(1, ""));
    if (bid === "op_letter_of") {
      const idx = Math.max(1, parseInt(r(0, 1), 10)) - 1;
      const str = String(r(1, ""));
      return str.charAt(idx) || "";
    }
    if (bid === "op_length" || bid === "op_length_of") return String(r(0, "")).length;
    return 0;
  }
};
