export function PriceDisplay({
  price,
  originalPrice,
  currency,
}: {
  price: number;
  originalPrice?: number;
  currency: string;
}) {
  const locale = currency === "CAD" ? "en-CA" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold">{formatter.format(price)}</span>
      {originalPrice && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatter.format(originalPrice)}
          </span>
          <span className="text-xs font-semibold text-green-600">
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
}
