import React, { useState } from "react";
import {
  Tag,
  CheckCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";

export default function CouponBox() {
  const {
    cartId,
    cartDiscountCodes,
    applyDiscountCode,
    removeDiscountCode,
  } = useCart();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const applied = cartDiscountCodes.find(
    (discount) => discount.applicable
  );

  const invalid = cartDiscountCodes.find(
    (discount) => !discount.applicable
  );

  const apply = async (event) => {
    event?.preventDefault();

    if (!code.trim() || loading) return;

    setLoading(true);

    try {
      await applyDiscountCode(code.trim());
      setCode("");
      toast.success("Discount code applied.");
    } catch (error) {
      toast.error(
        error.message ||
          "Could not apply this discount code."
      );
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);

    try {
      await removeDiscountCode();
      toast.success("Discount code removed.");
    } catch (error) {
      toast.error(
        error.message ||
          "Could not remove the discount code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#ff2f8a]/40 bg-[#111] p-4 sm:p-5">

      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">

          <span className="flex items-center gap-2">
            <CheckCircle size={18} />
            {applied.code} applied
          </span>

          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="transition hover:text-red-400 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">

          {/* LEFT */}
          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff2f8a]/10">
              <Tag
                size={25}
                className="text-[#ff2f8a]"
              />
            </div>

            <div>
              <h3 className="font-bold text-white">
                Have a discount code?
              </h3>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Enter your code to get special offers
              </p>
            </div>
          </div>

          {/* INPUT */}
          <form
            onSubmit={apply}
            className="flex overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b]"
          >
            <input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder="Enter discount code"
              aria-label="Discount code"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 sm:w-56"
            />

            <button
              type="submit"
              disabled={
                !cartId ||
                !code.trim() ||
                loading
              }
              className="bg-[#ff2f8a] px-5 text-sm font-bold text-white transition hover:bg-[#ff167c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "..." : "Apply"}
            </button>
          </form>
        </div>
      )}

      {invalid && (
        <p className="mt-2 text-xs text-red-400">
          {invalid.code} isn't valid for this cart.
        </p>
      )}
    </div>
  );
}