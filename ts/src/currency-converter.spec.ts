import {ConversionRateApi} from "./external/conversion-rate-api";
import {CurrencyConverter} from "./currency-converter";
import {Currency} from "./model/currency";
import {Money} from "./model/money";
import {CurrencyIsoCode} from "./external/currency-iso-code";

describe("CurrencyConverter", function () {
  let converter: CurrencyConverter;
  let conversionRateApi: ConversionRateApi;

  beforeEach(() => {
    conversionRateApi = new ConversionRateApi();
    converter = new CurrencyConverter(conversionRateApi);
  });

  it("should be defined", () => {
    expect(converter).toBeDefined();
  });


  it("should not call the API if not needed", () => {
    const result = converter.sum(Currency.Euro);

    expect(result).toEqual(new Money(0, Currency.Euro));
  });

  describe("when using mock", () => {
    it('should  perform the conversion on one single money', () => {
      // ARRANGE
      jest.spyOn(conversionRateApi, 'getRate').mockReturnValue(0.8);

      // If not using mockReturnValue it's the real function that will be called
      // jest.spyOn(conversionRateApi, 'getRate');

      // ACT
      const result = converter.sum(Currency.Euro, new Money(2, Currency.Dollar));

      // ASSERT
      expect(result).toEqual(new Money(2 * 0.8, Currency.Euro));
    });

    it('should not perform twice the same call', () => {
      // ARRANGE
      const dollarToEuroRate = 0.8;
      const mock = jest.spyOn(conversionRateApi, 'getRate').mockReturnValue(dollarToEuroRate);

      // ACT
      const result = converter.sum(Currency.Euro, new Money(2, Currency.Dollar), new Money(1, Currency.Dollar));

      // ASSERT
      expect(result).toEqual(new Money(3 * 0.8, Currency.Euro));
      // Boite blanche : on vérifie le fonctionnement interne de la méthode
      expect(mock).toHaveBeenCalledTimes(1); // <== LE PLUS IMPORTANT ICI : on vérifie que la méthode a été appelée une seule fois car l'API est payante (considération métier)
      // Boite noire on vérifie que la méthode a été appelée avec certains paramètres mais on sait pas comment fonctionne l'algorithme
      expect(mock).toHaveBeenCalledWith(CurrencyIsoCode.USD, CurrencyIsoCode.EUR);
    });

    it('should take into account the different rates', () => {
      // ARRANGE
      const dollarToEuroRate = 0.8;
      const poundToEuroRate = 1.2;
      jest.spyOn(conversionRateApi, 'getRate').mockImplementation((source : CurrencyIsoCode) => {
        if (source === CurrencyIsoCode.GBP) {
          return poundToEuroRate;
        }
        return dollarToEuroRate;
      });

      // ACT
      const result = converter.sum(Currency.Euro, new Money(2, Currency.Dollar), new Money(2, Currency.Pound));

      // ASSERT
      expect(result).toEqual(new Money((2 * dollarToEuroRate) + (2 * poundToEuroRate), Currency.Euro));
    });
  });
});
