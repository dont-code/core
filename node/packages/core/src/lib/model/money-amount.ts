/**
 * Store a monetary amount together with the currency (value and currency).
 * To be used by all fields managing currencies ('Euro', 'Dollar', 'Other currency' by default) in order to facilitate exchange between plugins
 */
export class MoneyAmount {
  amount: number | undefined;
  currencyCode: string | undefined;
}
