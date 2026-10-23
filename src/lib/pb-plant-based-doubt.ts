/** Plant-Based Cookbook (DK 2015): where the printed rows leave a diet or allergen in doubt, the check fails (only ever removes a pass).
 * A bought or unspecified base (stock, plant-based butter/cheese/yogurt, mayo, bread, puff pastry, sauces, creamer...) or a cross-reference
 * to another recipe in the book is in every set. */
export const PB_DOUBT_GLUTEN: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-079", // tamari: the print does not say gluten-free
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_DAIRY: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_NUTS: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-088", // nondairy milk "such as rice or coconut"
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_SUGAR: ReadonlySet<string> = new Set([
  "plnt-003", // Medjool dates
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-067", // sweetened dried cranberries
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
  "plnt-093", // pear nectar and dried cranberries
]);
export const PB_DOUBT_VEGAN: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_VEGETARIAN: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_SPICY: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
export const PB_DOUBT_SHELLFISH: ReadonlySet<string> = new Set([
  "plnt-006", // bought: plant-based yogurt
  "plnt-008", // xref: Mushroom Stock
  "plnt-012", // bought: egg replacer
  "plnt-013", // bought: baguette, hot sauce, plant-based mayonnaise, rolls, sriracha
  "plnt-014", // bought: breadcrumbs, rolls
  "plnt-015", // bought: ketchup, mayo, relish, rolls
  "plnt-016", // bought: bread
  "plnt-017", // bought: bread, breadcrumbs
  "plnt-018", // bought: rolls
  "plnt-019", // bought: rolls, sambal
  "plnt-020", // xref: Golden Chicken-y Stock; bought: vegetable stock
  "plnt-021", // bought: sriracha, vegetable stock
  "plnt-022", // bought: vegetable stock
  "plnt-023", // bought: sambal, vegetable stock
  "plnt-024", // bought: vegetable stock
  "plnt-025", // bought: vegetable stock
  "plnt-027", // bought: vegetable stock
  "plnt-028", // bought: hot sauce, sriracha, vegetable stock
  "plnt-029", // xref: Golden Chicken-y Stock; bought: sambal, vegetable stock
  "plnt-030", // bought: vegetable stock
  "plnt-031", // bought: creole seasoning, hot sauce, vegan worcestershire, vegetable stock, veggie andouille
  "plnt-033", // bought: plant-based plain yogurt, vegetable stock
  "plnt-034", // bought: curry paste, vegetable stock
  "plnt-035", // bought: hot sauce, plant-based sour cream, tortilla chips
  "plnt-036", // bought: creole seasoning, hot sauce, veggie andouille
  "plnt-037", // bought: vegetable stock
  "plnt-038", // bought: vegetable stock
  "plnt-039", // bought: mayo
  "plnt-041", // bought: hot sauce, mayo
  "plnt-044", // bought: vegetable stock
  "plnt-046", // bought: breadcrumbs, mayo, panko
  "plnt-048", // bought: vegetable stock
  "plnt-050", // bought: breadcrumbs
  "plnt-053", // bought: breadcrumbs, panko
  "plnt-058", // xref: Golden Chicken-y Stock; bought: puff pastry
  "plnt-059", // xref: Golden Chicken-y Stock; bought: phyllo
  "plnt-060", // bought: vegetable stock
  "plnt-061", // xref: Tomato Sauce
  "plnt-062", // bought: breadcrumbs, panko
  "plnt-063", // xref: Pesto, Tomato Sauce
  "plnt-064", // bought: vegetable stock
  "plnt-065", // bought: vegetable stock
  "plnt-068", // xref: Tomato Sauce; bought: breadcrumbs, panko
  "plnt-069", // bought: vegetable stock
  "plnt-070", // bought: vegetable stock
  "plnt-071", // xref: Fresh Pasta Dough; bought: wonton wrappers
  "plnt-072", // bought: vegetable stock
  "plnt-073", // bought: breadcrumbs, panko
  "plnt-074", // xref: Basic Seitan; bought: ketchup, vegetable stock
  "plnt-075", // bought: breadcrumbs, panko
  "plnt-076", // xref: Basic Seitan; bought: vegetable stock
  "plnt-077", // xref: Basic Seitan
  "plnt-080", // xref: Basic Seitan, Tzatziki
  "plnt-082", // bought: puff pastry
  "plnt-083", // bought: coffee creamer, cookies, gingersnap, plant-based butter
  "plnt-084", // xref: Pie Pastry; bought: plant-based butter
  "plnt-085", // bought: coffee creamer
  "plnt-087", // bought: cookies, pie filling, plant-based butter
  "plnt-089", // bought: coffee creamer
  "plnt-090", // bought: chocolate chips, coffee creamer
  "plnt-091", // bought: plant-based sour cream
]);
