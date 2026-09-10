/**
 * UNIFIVE Scripting - Reporter Evaluation Subsystem
 */
const EvalReporters = {
  evaluateReporterBlock(repBlock, targetItem, resolveFn) {
    if (!repBlock) return 0;
    const bid = repBlock.blockId || repBlock.id;
    const inputs = repBlock.inputs || [];
    const r = (idx, fb = 0) => (typeof resolveFn === "function" ? resolveFn(inputs[idx] !== undefined ? inputs[idx] : fb, targetItem) : (inputs[idx] !== undefined ? inputs[idx] : fb));

    if (bid === "op_add" || bid === "+" || repBlock.opType === "+") return Number(r(0, 0)) + Number(r(1, 0));
    if (bid === "op_subtract" || bid === "-" || repBlock.opType === "-") return Number(r(0, 0)) - Number(r(1, 0));
    if (bid === "op_multiply" || bid === "*" || repBlock.opType === "*") return Number(r(0, 0)) * Number(r(1, 0));
    if (bid === "op_divide" || bid === "/" || repBlock.opType === "/") {
      const d = Number(r(1, 1));
      return d === 0 ? 0 : Number(r(0, 0)) / d;
    }
    if (bid === "op_random" || repBlock.isRandom) {
      const min = Math.ceil(Number(r(0, 1)));
      const max = Math.floor(Number(r(1, 10)));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (bid === "op_join") return String(r(0, "apple")) + String(r(1, "banana"));
    if (bid === "op_letter_of") {
      const idx = (Number(r(0, 1)) || 1) - 1;
      const str = String(r(1, "apple"));
      return str[idx] || "";
    }
    if (bid === "op_length" || bid === "op_length_of") return String(r(0, "apple")).length;
    if (bid === "op_mod") return Number(r(0, 10)) % (Number(r(1, 3)) || 1);
    if (bid === "op_round") return Math.round(Number(r(0, 3.14)));
    if (bid === "op_abs") return Math.abs(Number(r(0, -10)));
    if (bid === "op_sqrt") return Math.sqrt(Math.max(0, Number(r(0, 9))));
    if (bid === "op_sin") return Math.sin((Number(r(0, 90)) * Math.PI) / 180);
    if (bid === "op_cos") return Math.cos((Number(r(0, 0)) * Math.PI) / 180);
    if (bid === "op_tan") return Math.tan((Number(r(0, 45)) * Math.PI) / 180);
    return 0;
  }
};
