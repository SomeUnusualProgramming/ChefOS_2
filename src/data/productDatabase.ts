import { ProductCategory } from '@/types/chefos';
import {
  Milk, Beef, Fish, Carrot, Apple, Wheat, Wine, Cookie, Snowflake,
  Coffee, Salad, ChefHat
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ProductEntry {
  /** Canonical name in English */
  en: string;
  /** Polish translation */
  pl: string;
  /** Spanish translation */
  es: string;
  /** German translation */
  de: string;
  /** Product category */
  category: ProductCategory;
  /** Lucide icon name */
  icon: string;
  /** Common misspellings and variations */
  aliases: string[];
  /** Typical shelf life in days */
  shelfLifeDays: number;
  /** Common abbreviations found on receipts */
  abbreviations?: string[];
}

export const PRODUCT_DATABASE: ProductEntry[] = [
  // DAIRY
  { en: 'milk', pl: 'mleko', es: 'leche', de: 'Milch', category: 'dairy', icon: 'Milk', aliases: ['mleczko', 'mleka', 'mléko', 'mlieko'], shelfLifeDays: 7, abbreviations: ['MLE', 'MLEKO'] },
  { en: 'cheese', pl: 'ser', es: 'queso', de: 'Käse', category: 'dairy', icon: 'Milk', aliases: ['sery', 'quesos', 'käse', 'ser żółty', 'ser biały'], shelfLifeDays: 14, abbreviations: ['SER'] },
  { en: 'yogurt', pl: 'jogurt', es: 'yogur', de: 'Joghurt', category: 'dairy', icon: 'Milk', aliases: ['yoghurt', 'yogurt', 'jogurty', 'jogur'], shelfLifeDays: 14, abbreviations: ['JOG', 'JOGURT'] },
  { en: 'butter', pl: 'masło', es: 'mantequilla', de: 'Butter', category: 'dairy', icon: 'Milk', aliases: ['maslo', 'mantequilla', 'butter'], shelfLifeDays: 30, abbreviations: ['MASL', 'MASLP'] },
  { en: 'cream', pl: 'śmietana', es: 'nata', de: 'Sahne', category: 'dairy', icon: 'Milk', aliases: ['smetana', 'smetany', 'śmietanka', 'nata'], shelfLifeDays: 10, abbreviations: ['SMIET'] },
  { en: 'kefir', pl: 'kefir', es: 'kefir', de: 'Kefir', category: 'dairy', icon: 'Milk', aliases: ['kefiry'], shelfLifeDays: 7, abbreviations: ['KEF'] },
  { en: 'cottage cheese', pl: 'twaróg', es: 'requesón', de: 'Quark', category: 'dairy', icon: 'Milk', aliases: ['twarog', 'ser twarogowy', 'quark'], shelfLifeDays: 10, abbreviations: ['TWAR'] },
  { en: 'sour cream', pl: 'śmietana kwaśna', es: 'crema agria', de: 'saure Sahne', category: 'dairy', icon: 'Milk', aliases: ['śmietana 12%', 'śmietana 18%'], shelfLifeDays: 14, abbreviations: [] },

  // MEAT
  { en: 'chicken', pl: 'kurczak', es: 'pollo', de: 'Hähnchen', category: 'meat', icon: 'ChefHat', aliases: ['chicken breast', 'chicken thighs', 'pierś z kurczaka', 'udka', 'pollo'], shelfLifeDays: 3, abbreviations: ['KURCZ', 'KURC', 'KUR'] },
  { en: 'beef', pl: 'wołowina', es: 'res', de: 'Rindfleisch', category: 'meat', icon: 'Beef', aliases: ['wolowina', 'steak', 'ground beef', 'wołowinę', 'roast beef'], shelfLifeDays: 3, abbreviations: ['WOL', 'WOLW'] },
  { en: 'pork', pl: 'wieprzowina', es: 'cerdo', de: 'Schweinefleisch', category: 'meat', icon: 'Beef', aliases: ['wieprzowine', 'schab', 'karkówka', 'boczek'], shelfLifeDays: 3, abbreviations: ['WIEP'] },
  { en: 'ham', pl: 'szynka', es: 'jamón', de: 'Schinken', category: 'meat', icon: 'Beef', aliases: ['szynka gotowana', 'szynka parmeńska', 'jamon'], shelfLifeDays: 14, abbreviations: ['SZYN'] },
  { en: 'bacon', pl: 'boczek', es: 'tocino', de: 'Speck', category: 'meat', icon: 'Beef', aliases: ['boczek wędzony', 'bekon', 'tocino'], shelfLifeDays: 14, abbreviations: ['BOCZ'] },
  { en: 'sausage', pl: 'kiełbasa', es: 'salchicha', de: 'Wurst', category: 'meat', icon: 'Beef', aliases: ['kielbasa', 'kiełbasy', 'parówki', 'salami', 'salchicha'], shelfLifeDays: 14, abbreviations: ['KIELB', 'PAR'] },
  { en: 'turkey', pl: 'indyk', es: 'pavo', de: 'Truthahn', category: 'meat', icon: 'ChefHat', aliases: ['pavo', 'pierś z indyka'], shelfLifeDays: 3, abbreviations: ['IND'] },
  { en: 'minced meat', pl: 'mięso mielone', es: 'carne molida', de: 'Hackfleisch', category: 'meat', icon: 'Beef', aliases: ['mielone', 'mielonka'], shelfLifeDays: 2, abbreviations: ['MIEL'] },

  // FISH
  { en: 'salmon', pl: 'łosoś', es: 'salmón', de: 'Lachs', category: 'fish', icon: 'Fish', aliases: ['losos', 'łososia', 'filet z łososia'], shelfLifeDays: 2, abbreviations: ['LOSOS', 'LOS'] },
  { en: 'tuna', pl: 'tuńczyk', es: 'atún', de: 'Thunfisch', category: 'fish', icon: 'Fish', aliases: ['tunczyk', 'atun'], shelfLifeDays: 2, abbreviations: ['TUNC'] },
  { en: 'cod', pl: 'dorsz', es: 'bacalao', de: 'Kabeljau', category: 'fish', icon: 'Fish', aliases: ['dorsza', 'filet z dorsza'], shelfLifeDays: 2, abbreviations: ['DORSZ'] },
  { en: 'mackerel', pl: 'makrela', es: 'caballa', de: 'Makrele', category: 'fish', icon: 'Fish', aliases: ['makrela wędzona', 'caballa'], shelfLifeDays: 5, abbreviations: ['MAKR'] },
  { en: 'herring', pl: 'śledź', es: 'arenque', de: 'Hering', category: 'fish', icon: 'Fish', aliases: ['śledzie', 'matias', 'arenque'], shelfLifeDays: 7, abbreviations: ['SLEDZ'] },
  { en: 'shrimp', pl: 'krewetki', es: 'camarones', de: 'Garnelen', category: 'fish', icon: 'Fish', aliases: ['krewetka', 'gambas', 'camarones'], shelfLifeDays: 2, abbreviations: ['KREW'] },
  { en: 'trout', pl: 'pstrąg', es: 'trucha', de: 'Forelle', category: 'fish', icon: 'Fish', aliases: ['pstrag', 'pstrąga', 'trucha'], shelfLifeDays: 2, abbreviations: ['PSTR'] },

  // VEGETABLES
  { en: 'tomato', pl: 'pomidor', es: 'tomate', de: 'Tomate', category: 'vegetables', icon: 'Salad', aliases: ['tomatoes', 'pomidory', 'pomidora', 'pomidorów', 'tomates', 'rajčata', 'paradajky'], shelfLifeDays: 5, abbreviations: ['POM', 'POMID'] },
  { en: 'lettuce', pl: 'sałata', es: 'lechuga', de: 'Salat', category: 'vegetables', icon: 'Salad', aliases: ['salata', 'sałaty', 'lechuga', 'koperek', 'salad greens'], shelfLifeDays: 5, abbreviations: ['SALAT'] },
  { en: 'cucumber', pl: 'ogórek', es: 'pepino', de: 'Gurke', category: 'vegetables', icon: 'Salad', aliases: ['ogorek', 'ogórki', 'pepinos', 'gurke'], shelfLifeDays: 7, abbreviations: ['OGOR', 'OG'] },
  { en: 'carrot', pl: 'marchew', es: 'zanahoria', de: 'Karotte', category: 'vegetables', icon: 'Carrot', aliases: ['marchewka', 'marchewki', 'marchewkę', 'carrots', 'zanahorias', 'möhre'], shelfLifeDays: 14, abbreviations: ['MARC', 'MAR'] },
  { en: 'potato', pl: 'ziemniak', es: 'patata', de: 'Kartoffel', category: 'vegetables', icon: 'Carrot', aliases: ['ziemniaki', 'kartofle', 'pyry', 'patatas', 'potatoes'], shelfLifeDays: 30, abbreviations: ['ZIEM', 'Ziem'] },
  { en: 'onion', pl: 'cebula', es: 'cebolla', de: 'Zwiebel', category: 'vegetables', icon: 'Carrot', aliases: ['cebulka', 'cebule', 'cebulę', 'cebollas'], shelfLifeDays: 30, abbreviations: ['CEB'] },
  { en: 'garlic', pl: 'czosnek', es: 'ajo', de: 'Knoblauch', category: 'vegetables', icon: 'Carrot', aliases: ['czosnku', 'zabek czosnku', 'ajos'], shelfLifeDays: 60, abbreviations: ['CZOSN'] },
  { en: 'bell pepper', pl: 'papryka', es: 'pimiento', de: 'Paprika', category: 'vegetables', icon: 'Salad', aliases: ['papryki', 'paprykę', 'pepper', 'peppers', 'pimientos'], shelfLifeDays: 7, abbreviations: ['PAPR'] },
  { en: 'spinach', pl: 'szpinak', es: 'espinaca', de: 'Spinat', category: 'vegetables', icon: 'Salad', aliases: ['szpinaku', 'espinacas'], shelfLifeDays: 5, abbreviations: ['SZPIN'] },
  { en: 'broccoli', pl: 'brokuł', es: 'brócoli', de: 'Brokkoli', category: 'vegetables', icon: 'Salad', aliases: ['brokuly', 'brokuły', 'broccoli'], shelfLifeDays: 7, abbreviations: ['BROK'] },
  { en: 'cauliflower', pl: 'kalafior', es: 'coliflor', de: 'Blumenkohl', category: 'vegetables', icon: 'Salad', aliases: ['kalafiory', 'coliflor'], shelfLifeDays: 7, abbreviations: ['KALAF'] },
  { en: 'cabbage', pl: 'kapusta', es: 'repollo', de: 'Kohl', category: 'vegetables', icon: 'Salad', aliases: ['kapusty', 'kapustę', 'repollo'], shelfLifeDays: 14, abbreviations: ['KAP'] },
  { en: 'leek', pl: 'por', es: 'puerro', de: 'Lauch', category: 'vegetables', icon: 'Carrot', aliases: ['pory', 'pore', 'puerros'], shelfLifeDays: 14, abbreviations: ['POR'] },
  { en: 'celery', pl: 'seler', es: 'apio', de: 'Sellerie', category: 'vegetables', icon: 'Carrot', aliases: ['selera', 'seler naciowy'], shelfLifeDays: 14, abbreviations: ['SELER'] },
  { en: 'mushroom', pl: 'pieczarka', es: 'champiñón', de: 'Champignon', category: 'vegetables', icon: 'Salad', aliases: ['pieczarki', 'pieczarkę', 'champignons', 'mushrooms', 'grzyby'], shelfLifeDays: 5, abbreviations: ['PIECZ'] },
  { en: 'zucchini', pl: 'cukinia', es: 'calabacín', de: 'Zucchini', category: 'vegetables', icon: 'Salad', aliases: ['cukinie', 'cukinię', 'zucchinis'], shelfLifeDays: 7, abbreviations: ['CUKIN'] },
  { en: 'eggplant', pl: 'bakłażan', es: 'berenjena', de: 'Aubergine', category: 'vegetables', icon: 'Salad', aliases: ['baklazan', 'bakłażana', 'berenjenas'], shelfLifeDays: 7, abbreviations: ['BAKL'] },
  { en: 'beetroot', pl: 'burak', es: 'remolacha', de: 'Rote Bete', category: 'vegetables', icon: 'Carrot', aliases: ['buraki', 'buraka', 'remolachas'], shelfLifeDays: 21, abbreviations: ['BUR'] },
  { en: 'radish', pl: 'rzodkiewka', es: 'rábano', de: 'Radieschen', category: 'vegetables', icon: 'Salad', aliases: ['rzodkiewki', 'rzodkiewkę', 'rabanos'], shelfLifeDays: 7, abbreviations: ['RZODK'] },

  // FRUITS
  { en: 'apple', pl: 'jabłko', es: 'manzana', de: 'Apfel', category: 'fruits', icon: 'Apple', aliases: ['jabłka', 'jabłko', 'jablko', 'jabłek', 'manzanas', 'äpfel'], shelfLifeDays: 21, abbreviations: ['JABL'] },
  { en: 'banana', pl: 'banan', es: 'plátano', de: 'Banane', category: 'fruits', icon: 'Apple', aliases: ['banany', 'banana', 'bananas', 'platanos', 'plátanos'], shelfLifeDays: 7, abbreviations: ['BAN'] },
  { en: 'orange', pl: 'pomarańcza', es: 'naranja', de: 'Orange', category: 'fruits', icon: 'Apple', aliases: ['pomarancza', 'pomarańcze', 'pomarańczę', 'naranjas'], shelfLifeDays: 14, abbreviations: ['POMAR'] },
  { en: 'lemon', pl: 'cytryna', es: 'limón', de: 'Zitrone', category: 'fruits', icon: 'Apple', aliases: ['cytryny', 'cytrynę', 'limones'], shelfLifeDays: 21, abbreviations: ['CYTR'] },
  { en: 'grape', pl: 'winogrono', es: 'uva', de: 'Traube', category: 'fruits', icon: 'Apple', aliases: ['winogrona', 'winogron', 'uvas'], shelfLifeDays: 7, abbreviations: ['WINOGR'] },
  { en: 'strawberry', pl: 'truskawka', es: 'fresa', de: 'Erdbeere', category: 'fruits', icon: 'Apple', aliases: ['truskawki', 'truskawkę', 'fresas', 'strawberries'], shelfLifeDays: 3, abbreviations: ['TRUSK'] },
  { en: 'blueberry', pl: 'borówka', es: 'arándano', de: 'Blaubeere', category: 'fruits', icon: 'Apple', aliases: ['borowka', 'borówki', 'borówkę', 'arándanos', 'blueberries', 'jagody'], shelfLifeDays: 5, abbreviations: ['BOROW'] },
  { en: 'raspberry', pl: 'malina', es: 'frambuesa', de: 'Himbeere', category: 'fruits', icon: 'Apple', aliases: ['maliny', 'malinę', 'frambuesas'], shelfLifeDays: 3, abbreviations: ['MAL'] },
  { en: 'pear', pl: 'gruszka', es: 'pera', de: 'Birne', category: 'fruits', icon: 'Apple', aliases: ['gruszki', 'gruszkę', 'peras', 'pears'], shelfLifeDays: 14, abbreviations: ['GRUSZ'] },
  { en: 'peach', pl: 'brzoskwinia', es: 'melocotón', de: 'Pfirsich', category: 'fruits', icon: 'Apple', aliases: ['brzoskwinie', 'brzoskwinię', 'melocotones'], shelfLifeDays: 5, abbreviations: ['BRZOSK'] },
  { en: 'plum', pl: 'śliwka', es: 'ciruela', de: 'Pflaume', category: 'fruits', icon: 'Apple', aliases: ['sliwka', 'śliwki', 'śliwkę', 'ciruelas'], shelfLifeDays: 7, abbreviations: ['SLIW'] },
  { en: 'cherry', pl: 'wiśnia', es: 'cereza', de: 'Kirsche', category: 'fruits', icon: 'Apple', aliases: ['wisnie', 'wiśnie', 'wiśnię', 'cerezas', 'czereśnia'], shelfLifeDays: 5, abbreviations: ['WISN'] },
  { en: 'kiwi', pl: 'kiwi', es: 'kiwi', de: 'Kiwi', category: 'fruits', icon: 'Apple', aliases: ['kiwis'], shelfLifeDays: 14, abbreviations: ['KIWI'] },
  { en: 'melon', pl: 'melon', es: 'melón', de: 'Melone', category: 'fruits', icon: 'Apple', aliases: ['melony', 'melona', 'melones'], shelfLifeDays: 7, abbreviations: ['MELON'] },
  { en: 'watermelon', pl: 'arbuz', es: 'sandía', de: 'Wassermelone', category: 'fruits', icon: 'Apple', aliases: ['arbuzy', 'arbuzów', 'sandias'], shelfLifeDays: 7, abbreviations: ['ARBUZ'] },
  { en: 'pineapple', pl: 'ananas', es: 'piña', de: 'Ananas', category: 'fruits', icon: 'Apple', aliases: ['ananasy', 'ananasa', 'pinas'], shelfLifeDays: 7, abbreviations: ['ANAN'] },
  { en: 'mango', pl: 'mango', es: 'mango', de: 'Mango', category: 'fruits', icon: 'Apple', aliases: ['mangoes', 'mangi'], shelfLifeDays: 7, abbreviations: ['MANGO'] },
  { en: 'avocado', pl: 'awokado', es: 'aguacate', de: 'Avocado', category: 'fruits', icon: 'Apple', aliases: ['awokado', 'awokados', 'aguacates'], shelfLifeDays: 5, abbreviations: ['AWOK'] },
  { en: 'pomegranate', pl: 'granat', es: 'granada', de: 'Granatapfel', category: 'fruits', icon: 'Apple', aliases: ['granaty', 'granata', 'granadas'], shelfLifeDays: 21, abbreviations: ['GRANAT'] },

  // GRAINS
  { en: 'bread', pl: 'chleb', es: 'pan', de: 'Brot', category: 'grains', icon: 'Wheat', aliases: ['chleba', 'chlebka', 'pans', 'brote', 'bagietka', 'baguette'], shelfLifeDays: 5, abbreviations: ['CHLEB'] },
  { en: 'rice', pl: 'ryż', es: 'arroz', de: 'Reis', category: 'grains', icon: 'Wheat', aliases: ['ryz', 'ryżu', 'ryżowy', 'arroces'], shelfLifeDays: 365, abbreviations: ['RYZ', 'RYŻ'] },
  { en: 'pasta', pl: 'makaron', es: 'pasta', de: 'Nudeln', category: 'grains', icon: 'Wheat', aliases: ['makaronu', 'spaghetti', 'penne', 'tagliatelle', 'nudeln'], shelfLifeDays: 365, abbreviations: ['MAKA', 'MAK'] },
  { en: 'flour', pl: 'mąka', es: 'harina', de: 'Mehl', category: 'grains', icon: 'Wheat', aliases: ['maka', 'mąki', 'mąkę', 'harinas'], shelfLifeDays: 180, abbreviations: ['MĄKA', 'MAKA'] },
  { en: 'oats', pl: 'owsianka', es: 'avena', de: 'Hafer', category: 'grains', icon: 'Wheat', aliases: ['owsiane', 'płatki owsiane', 'avenas', 'oatmeal', 'oat'], shelfLifeDays: 180, abbreviations: ['OWS'] },
  { en: 'cereal', pl: 'płatki śniadaniowe', es: 'cereal', de: 'Müsli', category: 'grains', icon: 'Wheat', aliases: ['platki', 'płatki', 'cereals', 'cornflakes'], shelfLifeDays: 180, abbreviations: ['PLATKI'] },
  { en: 'tortilla', pl: 'tortilla', es: 'tortilla', de: 'Tortilla', category: 'grains', icon: 'Wheat', aliases: ['tortille', 'tortillas', 'wrap'], shelfLifeDays: 14, abbreviations: ['TORT'] },
  { en: 'couscous', pl: 'kuskus', es: 'cuscús', de: 'Couscous', category: 'grains', icon: 'Wheat', aliases: ['cous-cous', 'kuskusy'], shelfLifeDays: 365, abbreviations: ['KUSK'] },
  { en: 'quinoa', pl: 'komosa', es: 'quinoa', de: 'Quinoa', category: 'grains', icon: 'Wheat', aliases: ['quinoa', 'komosa ryżowa'], shelfLifeDays: 365, abbreviations: ['QUIN'] },

  // BEVERAGES
  { en: 'water', pl: 'woda', es: 'agua', de: 'Wasser', category: 'beverages', icon: 'Coffee', aliases: ['wody', 'wodę', 'agua', 'mineral water', 'sparkling water'], shelfLifeDays: 365, abbreviations: ['WODA'] },
  { en: 'juice', pl: 'sok', es: 'zumo', de: 'Saft', category: 'beverages', icon: 'Coffee', aliases: ['soki', 'soków', 'soku', 'zumos', 'saft', 'orange juice', 'apple juice'], shelfLifeDays: 7, abbreviations: ['SOK'] },
  { en: 'coffee', pl: 'kawa', es: 'café', de: 'Kaffee', category: 'beverages', icon: 'Coffee', aliases: ['kawy', 'kawę', 'cafe', 'kaffee'], shelfLifeDays: 365, abbreviations: ['KAWA'] },
  { en: 'tea', pl: 'herbata', es: 'té', de: 'Tee', category: 'beverages', icon: 'Coffee', aliases: ['herbaty', 'herbatę', 'herbatek', 'tees'], shelfLifeDays: 365, abbreviations: ['HERB'] },
  { en: 'beer', pl: 'piwo', es: 'cerveza', de: 'Bier', category: 'beverages', icon: 'Coffee', aliases: ['piwa', 'piwo', 'piwem', 'cervezas'], shelfLifeDays: 180, abbreviations: ['PIWO'] },
  { en: 'wine', pl: 'wino', es: 'vino', de: 'Wein', category: 'beverages', icon: 'Wine', aliases: ['wina', 'wino', 'vinos'], shelfLifeDays: 365, abbreviations: ['WINO'] },
  { en: 'soda', pl: 'napój gazowany', es: 'refresco', de: 'Limonade', category: 'beverages', icon: 'Coffee', aliases: ['cola', 'pepsi', 'fanta', 'sprite', 'napoje'], shelfLifeDays: 180, abbreviations: ['COLA'] },
  { en: 'sparkling water', pl: 'woda gazowana', es: 'agua con gas', de: 'Sprudelwasser', category: 'beverages', icon: 'Coffee', aliases: ['gazowana', 'gazówka'], shelfLifeDays: 180, abbreviations: ['WODAG'] },

  // CONDIMENTS
  { en: 'salt', pl: 'sól', es: 'sal', de: 'Salz', category: 'condiments', icon: 'ChefHat', aliases: ['soli', 'sole', 'sale', 'salzes'], shelfLifeDays: 365, abbreviations: ['SOL'] },
  { en: 'sugar', pl: 'cukier', es: 'azúcar', de: 'Zucker', category: 'condiments', icon: 'ChefHat', aliases: ['cukru', 'cukrem', 'azucar', 'zuckers'], shelfLifeDays: 365, abbreviations: ['CUKIER'] },
  { en: 'pepper', pl: 'pieprz', es: 'pimienta', de: 'Pfeffer', category: 'condiments', icon: 'ChefHat', aliases: ['pieprzu', 'pieprzem', 'pimientas'], shelfLifeDays: 365, abbreviations: ['PIEPRZ'] },
  { en: 'oil', pl: 'olej', es: 'aceite', de: 'Öl', category: 'condiments', icon: 'ChefHat', aliases: ['oleju', 'olejem', 'aceites', 'oils', 'olive oil', 'olive oil'], shelfLifeDays: 365, abbreviations: ['OLEJ'] },
  { en: 'vinegar', pl: 'ocet', es: 'vinagre', de: 'Essig', category: 'condiments', icon: 'ChefHat', aliases: ['octu', 'octem', 'octy', 'vinagres'], shelfLifeDays: 365, abbreviations: ['OCET'] },
  { en: 'mustard', pl: 'musztarda', es: 'mostaza', de: 'Senf', category: 'condiments', icon: 'ChefHat', aliases: ['musztardy', 'musztardę', 'mostazas'], shelfLifeDays: 365, abbreviations: ['MUSZT'] },
  { en: 'ketchup', pl: 'ketchup', es: 'kétchup', de: 'Ketchup', category: 'condiments', icon: 'ChefHat', aliases: ['ketchupy', 'catsup'], shelfLifeDays: 180, abbreviations: ['KETCH'] },
  { en: 'mayonnaise', pl: 'majonez', es: 'mayonesa', de: 'Mayonnaise', category: 'condiments', icon: 'ChefHat', aliases: ['majonezu', 'majonezem', 'majonezy', 'mayonesas'], shelfLifeDays: 90, abbreviations: ['MAJON'] },
  { en: 'soy sauce', pl: 'sos sojowy', es: 'salsa de soja', de: 'Sojasauce', category: 'condiments', icon: 'ChefHat', aliases: ['soy', 'sos sojowy', 'shoyu'], shelfLifeDays: 365, abbreviations: ['SOJOWY'] },
  { en: 'honey', pl: 'miód', es: 'miel', de: 'Honig', category: 'condiments', icon: 'ChefHat', aliases: ['miodu', 'miodek', 'miel', 'honeys'], shelfLifeDays: 365, abbreviations: ['MIOD'] },
  { en: 'jam', pl: 'dżem', es: 'mermelada', de: 'Marmelade', category: 'condiments', icon: 'ChefHat', aliases: ['dzem', 'dzemy', 'dzemik', 'mermeladas'], shelfLifeDays: 180, abbreviations: ['DZEM'] },
  { en: 'nutella', pl: 'nutella', es: 'nutella', de: 'Nutella', category: 'condiments', icon: 'ChefHat', aliases: ['nutelli', 'krem czekoladowy'], shelfLifeDays: 180, abbreviations: ['NUTEL'] },
  { en: 'peanut butter', pl: 'masło orzechowe', es: 'mantequilla de cacahuete', de: 'Erdnussbutter', category: 'condiments', icon: 'ChefHat', aliases: ['maslo orzechowe', 'masła orzechowego', 'nut butter'], shelfLifeDays: 180, abbreviations: ['MORzech'] },

  // SNACKS
  { en: 'chocolate', pl: 'czekolada', es: 'chocolate', de: 'Schokolade', category: 'snacks', icon: 'Cookie', aliases: ['czekolady', 'czekoladę', 'chocolates', 'schokoladen'], shelfLifeDays: 180, abbreviations: ['CZEKOL'] },
  { en: 'cookie', pl: 'ciastko', es: 'galleta', de: 'Keks', category: 'snacks', icon: 'Cookie', aliases: ['ciastka', 'ciasteczko', 'ciasteczka', 'galletas', 'cookies'], shelfLifeDays: 30, abbreviations: ['CIAST'] },
  { en: 'crisps', pl: 'czipsy', es: 'patatas fritas', de: 'Chips', category: 'snacks', icon: 'Cookie', aliases: ['chipsy', 'chips', 'crispy', 'patatas fritas'], shelfLifeDays: 60, abbreviations: ['CHIPS'] },
  { en: 'nuts', pl: 'orzechy', es: 'nueces', de: 'Nüsse', category: 'snacks', icon: 'Cookie', aliases: ['orzech', 'orzechów', 'nuez', 'nüsse', 'almonds', 'walnuts', 'cashews'], shelfLifeDays: 180, abbreviations: ['ORECH'] },
  { en: 'popcorn', pl: 'popcorn', es: 'palomitas', de: 'Popcorn', category: 'snacks', icon: 'Cookie', aliases: ['popkorn', 'palomitas de maiz'], shelfLifeDays: 90, abbreviations: ['POP'] },
  { en: 'candy', pl: 'cukierki', es: 'caramelo', de: 'Süßigkeiten', category: 'snacks', icon: 'Cookie', aliases: ['cukierków', 'cukierek', 'caramelos'], shelfLifeDays: 180, abbreviations: ['CUKIERK'] },
  { en: 'crackers', pl: 'krakersy', es: 'galletas saladas', de: 'Cracker', category: 'snacks', icon: 'Cookie', aliases: ['krakers', 'krakersów'], shelfLifeDays: 90, abbreviations: ['KRAK'] },
  { en: 'granola bar', pl: 'baton musli', es: 'barra de granola', de: 'Müsliriegel', category: 'snacks', icon: 'Cookie', aliases: ['batony', 'batoniki', 'granola bars'], shelfLifeDays: 90, abbreviations: ['BATON'] },

  // FROZEN
  { en: 'ice cream', pl: 'lody', es: 'helado', de: 'Eis', category: 'frozen', icon: 'Snowflake', aliases: ['lód', 'lodów', 'helados', 'eiscreme', 'gelato'], shelfLifeDays: 90, abbreviations: ['LODY'] },
  { en: 'frozen pizza', pl: 'mrożona pizza', es: 'pizza congelada', de: 'Tiefkühlpizza', category: 'frozen', icon: 'Snowflake', aliases: ['pizza mrozona', 'pizza zamrożona', 'pizzy mrożone'], shelfLifeDays: 90, abbreviations: ['PIZZA'] },
  { en: 'frozen vegetables', pl: 'mrożone warzywa', es: 'verduras congeladas', de: 'Tiefkühlgemüse', category: 'frozen', icon: 'Snowflake', aliases: ['warzywa mrożone', 'mrożówki', 'frozen veg'], shelfLifeDays: 180, abbreviations: ['WARZMROZ'] },
  { en: 'frozen dumplings', pl: 'mrożone pierogi', es: 'empanadas congeladas', de: 'Tiefkühlteigtaschen', category: 'frozen', icon: 'Snowflake', aliases: ['pierogi mrożone', 'pierogi z zamrażarki'], shelfLifeDays: 90, abbreviations: ['PIERMROZ'] },
  { en: 'frozen fish', pl: 'mrożona ryba', es: 'pescado congelado', de: 'Tiefkühlfisch', category: 'frozen', icon: 'Snowflake', aliases: ['ryba mrożona', 'frozen seafood'], shelfLifeDays: 90, abbreviations: ['RYBMROZ'] },

  // OTHER (eggs are often near dairy but classified separately)
  { en: 'eggs', pl: 'jajka', es: 'huevos', de: 'Eier', category: 'other', icon: 'ChefHat', aliases: ['jajko', 'jajeczko', 'jaj', 'huevos', 'eier', 'egg'], shelfLifeDays: 21, abbreviations: ['JAJKA', 'JAJ'] },
  { en: 'tofu', pl: 'tofu', es: 'tofu', de: 'Tofu', category: 'other', icon: 'ChefHat', aliases: ['tofu', 'ser sojowy', 'tofu naturalne', 'tofu wędzone', 'tofu twarde', 'tofu miękkie', 'silken tofu', 'firm tofu', 'extra firm tofu', 'tofu smażone'], shelfLifeDays: 7, abbreviations: ['TOFU'] },
  { en: 'hummus', pl: 'hummus', es: 'hummus', de: 'Hummus', category: 'other', icon: 'ChefHat', aliases: ['humus', 'chumus'], shelfLifeDays: 7, abbreviations: ['HUMM'] },
];

// Validate receipt products against database
export interface ValidatedReceiptProduct {
  originalName: string;
  detectedQuantity?: number;
  detectedUnit?: string;
  price?: number;
  matchedProduct?: ProductEntry;
  confidence: number;
  isValid: boolean;
  needsReview: boolean;
  suggestedName?: string;
  suggestedCategory?: ProductCategory;
}

export function validateReceiptProduct(
  name: string,
  quantity?: number,
  unit?: string,
  price?: number
): ValidatedReceiptProduct {
  const trimmedName = name.trim();

  // Check for suspicious patterns
  const suspicious = isSuspiciousProductName(trimmedName);
  if (!suspicious.isValid) {
    return {
      originalName: trimmedName,
      detectedQuantity: quantity,
      detectedUnit: unit,
      price,
      confidence: 0,
      isValid: false,
      needsReview: true,
      suggestedName: trimmedName,
    };
  }

  // Try exact match first
  const exactMatch = getProductByName(trimmedName);
  if (exactMatch) {
    return {
      originalName: trimmedName,
      detectedQuantity: quantity,
      detectedUnit: unit,
      price,
      matchedProduct: exactMatch,
      confidence: 1,
      isValid: true,
      needsReview: false,
      suggestedName: exactMatch.pl,
      suggestedCategory: exactMatch.category,
    };
  }

  // Try fuzzy match
  const fuzzyMatch = findBestProductMatch(trimmedName, 0.6);
  if (fuzzyMatch) {
    return {
      originalName: trimmedName,
      detectedQuantity: quantity,
      detectedUnit: unit,
      price,
      matchedProduct: fuzzyMatch.product,
      confidence: fuzzyMatch.confidence,
      isValid: true,
      needsReview: fuzzyMatch.confidence < 0.85 || fuzzyMatch.isTypo,
      suggestedName: fuzzyMatch.product.pl,
      suggestedCategory: fuzzyMatch.product.category,
    };
  }

  // Unknown product
  return {
    originalName: trimmedName,
    detectedQuantity: quantity,
    detectedUnit: unit,
    price,
    confidence: 0,
    isValid: false,
    needsReview: true,
    suggestedName: trimmedName,
    suggestedCategory: 'other',
  };
}

export function validateReceiptProducts(
  products: { name: string; quantity?: number; unit?: string; price?: number }[]
): ValidatedReceiptProduct[] {
  return products.map(p => validateReceiptProduct(p.name, p.quantity, p.unit, p.price));
}

// Build lookup maps for efficient matching
const NAME_TO_PRODUCT = new Map<string, ProductEntry>();
const ALIAS_TO_PRODUCT = new Map<string, ProductEntry>();
const ALL_VALID_NAMES = new Set<string>();

// Initialize lookup maps
PRODUCT_DATABASE.forEach(product => {
  // Map all translations
  [product.en, product.pl, product.es, product.de].forEach(name => {
    const key = normalizeProductName(name);
    NAME_TO_PRODUCT.set(key, product);
    ALL_VALID_NAMES.add(key);
  });

  // Map aliases
  product.aliases.forEach(alias => {
    const key = normalizeProductName(alias);
    ALIAS_TO_PRODUCT.set(key, product);
    ALL_VALID_NAMES.add(key);
  });

  // Map abbreviations
  product.abbreviations?.forEach(abbr => {
    const key = normalizeProductName(abbr);
    ALIAS_TO_PRODUCT.set(key, product);
    ALL_VALID_NAMES.add(key);
  });
});

function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-ząćęłńóśźż]/gi, '');
}

export function getProductByName(name: string): ProductEntry | undefined {
  const normalized = normalizeProductName(name);
  return NAME_TO_PRODUCT.get(normalized) || ALIAS_TO_PRODUCT.get(normalized);
}

export function getProductNameInLanguage(product: ProductEntry, lang: 'en' | 'pl' | 'es' | 'de'): string {
  return product[lang];
}

export function getCategoryIcon(category: ProductCategory): LucideIcon {
  const iconMap: Record<ProductCategory, LucideIcon> = {
    dairy: Milk,
    meat: Beef,
    fish: Fish,
    vegetables: Carrot,
    fruits: Apple,
    grains: Wheat,
    beverages: Coffee,
    condiments: ChefHat,
    snacks: Cookie,
    frozen: Snowflake,
    other: ChefHat,
  };
  return iconMap[category] || ChefHat;
}

export function isKnownProduct(name: string): boolean {
  const normalized = normalizeProductName(name);
  return ALL_VALID_NAMES.has(normalized) || !!getProductByName(name);
}

// Levenshtein distance for typo detection
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

export interface ProductMatch {
  product: ProductEntry;
  confidence: number; // 0-1, 1 = exact match
  isTypo: boolean;
}

export function findBestProductMatch(name: string, threshold = 0.7): ProductMatch | null {
  const normalized = normalizeProductName(name);

  // Exact match
  const exact = getProductByName(name);
  if (exact) {
    return { product: exact, confidence: 1, isTypo: false };
  }

  // Fuzzy match against all valid names
  let bestMatch: { product: ProductEntry; distance: number; originalName: string } | null = null;

  for (const validName of ALL_VALID_NAMES) {
    const distance = levenshteinDistance(normalized, validName);
    const maxLen = Math.max(normalized.length, validName.length);
    const similarity = 1 - distance / maxLen;

    if (similarity >= threshold && (!bestMatch || distance < bestMatch.distance)) {
      const product = NAME_TO_PRODUCT.get(validName) || ALIAS_TO_PRODUCT.get(validName);
      if (product) {
        bestMatch = { product, distance, originalName: validName };
      }
    }
  }

  if (bestMatch) {
    const confidence = 1 - bestMatch.distance / Math.max(normalized.length, bestMatch.originalName.length);
    return { product: bestMatch.product, confidence, isTypo: true };
  }

  return null;
}

// Check if text looks like a valid product command vs actual product
const INVALID_PATTERNS = [
  // Commands that shouldn't be products
  /^dodaj/i,
  /^usu[ńn]/i,
  /^skre[śs]l/i,
  /^wł[oó]ż/i,
  /^wpisz/i,
  /^kup/i,
  /^kupi/i,
  /^test/i,
  /^sprawd[źz]/i,
  /^zobacz/i,
  /^poka[żz]/i,
  /^lista/i,
  /^asdf/i,
  /^qwerty/i,
  /^xxxx/i,
  /^rtfdgg/i,
  /do lod[oó]wk/i,
  /z lod[oó]wk/i,
  /do listy/i,
  /z listy/i,
  /na zakup/i,
  /ze sklepu/i,
  /dzi[śs]nie/i,
  /na jutro/i,
  /na obiad/i,
  /na kolacj/i,
  /na [śs]niadani/i,
];

const VALID_WORD_PATTERNS = /[aeiouyąęóśłżźćń]/i;

export function isSuspiciousProductName(name: string): { isValid: boolean; reason?: string } {
  const normalized = name.toLowerCase().trim();

  // Too short or too long
  if (normalized.length < 2) {
    return { isValid: false, reason: 'too_short' };
  }
  if (normalized.length > 50) {
    return { isValid: false, reason: 'too_long' };
  }

  // Contains no vowels (not a real word)
  if (!VALID_WORD_PATTERNS.test(normalized)) {
    return { isValid: false, reason: 'no_vowels' };
  }

  // Matches command patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(normalized)) {
      return { isValid: false, reason: 'looks_like_command' };
    }
  }

  // Random characters (high consonant ratio)
  const letters = normalized.replace(/[^a-ząćęłńóśźż]/gi, '');
  if (letters.length > 0) {
    const consonants = (letters.match(/[bcdfghjklmnpqrstvwxz]/gi) || []).length;
    if (consonants / letters.length > 0.8) {
      return { isValid: false, reason: 'too_many_consonants' };
    }
  }

  // Gibberish detection - repeating same letter
  const repeats = normalized.match(/(.)(\1{2,})/g);
  if (repeats && repeats.length > 1) {
    return { isValid: false, reason: 'repeating_chars' };
  }

  return { isValid: true };
}

export interface ParsedProduct {
  originalName: string;
  suggestedName: string;
  suggestedNamePl: string;
  category: ProductCategory;
  icon: string;
  shelfLifeDays: number;
  confidence: number;
  isTypo: boolean;
  needsReview: boolean;
  reviewReason?: string;
}

export function parseAndValidateProduct(
  input: string,
  language: 'en' | 'pl' | 'es' | 'de' = 'pl'
): ParsedProduct {
  const trimmed = input.trim();

  // Check for suspicious patterns first
  const suspicious = isSuspiciousProductName(trimmed);
  if (!suspicious.isValid) {
    return {
      originalName: trimmed,
      suggestedName: trimmed,
      suggestedNamePl: trimmed,
      category: 'other',
      icon: 'ChefHat',
      shelfLifeDays: 7,
      confidence: 0,
      isTypo: false,
      needsReview: true,
      reviewReason: suspicious.reason,
    };
  }

  // Try to find matching product
  const match = findBestProductMatch(trimmed, 0.6);

  if (match) {
    const product = match.product;
    return {
      originalName: trimmed,
      suggestedName: product.en,
      suggestedNamePl: product.pl,
      category: product.category,
      icon: product.icon,
      shelfLifeDays: product.shelfLifeDays,
      confidence: match.confidence,
      isTypo: match.isTypo,
      needsReview: match.confidence < 0.85, // Low confidence needs review
      reviewReason: match.confidence < 0.85 ? 'low_confidence' : undefined,
    };
  }

  // Unknown product - needs review
  return {
    originalName: trimmed,
    suggestedName: trimmed,
    suggestedNamePl: trimmed,
    category: 'other',
    icon: 'ChefHat',
    shelfLifeDays: 7,
    confidence: 0,
    isTypo: false,
    needsReview: true,
    reviewReason: 'unknown_product',
  };
}
