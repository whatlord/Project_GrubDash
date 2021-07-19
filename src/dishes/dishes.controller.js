const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next){
    res.json({data: dishes})
}

function validateDish(req, res, next){
    const { data: { name, description, price, image_url } = {} } = req.body;

    if(name && description && typeof price === "number" && price>0 && image_url){
        return next();
    }else{
        next({
            status: 400,
            message: `name, description, price, and image_url need to be filled out`
        })
    }
}

function create(req, res, next){
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();
  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });

}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id == dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  };
  
function read(req, res, next) {
    res.json({ data: res.locals.dish });
};

function validateId(req, res, next){
    const { dishId } = req.params;
    const dish = req.body.data;
    const id = dish.id
    if(id && id !== dishId){
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    }else{
        return next();
    }
}

function update(req, res, next){
    const dish = res.locals.dish;
    const { data: { name, description, image_url, price} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.image_url= image_url;
    dish.price = price;

    res.json({data: dish })
}

module.exports = {
    list,
    create: [validateDish, create],
    read: [dishExists, read],
    update: [dishExists, validateDish, validateId, update]
}