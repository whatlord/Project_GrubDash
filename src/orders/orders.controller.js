const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next){
    res.json({ data: orders })
}

function validateOrder(req, res, next){
    const {data: {deliverTo, mobileNumber,  dishes} = {} } = req.body;
    const newOrder = {
        deliverTo,
        mobileNumber,
        dishes
    }
    for(let property in newOrder){
        if(!newOrder[property]){
            next({
                status: 400,
                message: `Order must include a ${property}.`
            })
        }
    }
    if(dishes.length === 0){
        next({
            status: 400,
            message: `Order must include at least one dish`
        })
    }
    for(let index in dishes){
        const dish = dishes[index];
        if(!dish.quantity || dish.quantity < 0 || typeof dish.quantity !== 'number'){
            next({
                status: 400,
                message: `dish ${index} must have a quantity that is an integer greater than 0`
            })
        }

    }
    res.locals.order = newOrder;
    return next()
}

function create(req, res, next){
    const order = res.locals.order;
    const newId = nextId();
    const newOrder = {
        id: newId,
        ...order
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId)
    if(!foundOrder){
        next({
            status: 404,
            message: `no order matching id: ${orderId}`
        })
    }else{
        res.locals.order = foundOrder;
        return next();
    }
}

function read(req, res){
    res.status(200).json({ data: res.locals.order })
}

function updateValidation(req, res, next){
    const { orderId } = req.params
    const newOrder = req.body.data;
    const oldOrder = orders.find(order => order.id === orderId)
    const status = newOrder.status;
    const possibleStatuses = ['pending', 'preparing', 'out-for-delivery', 'delivered']
    if(newOrder.id && newOrder.id !== orderId){
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${newOrder.id}, Route: ${orderId}`
        })
    }
    if(possibleStatuses.includes(status)){
        if(status === 'delivered'){
            next({
                status: 400,
                message: `A delivered order cannot be changed`
            })
        }else{
            return next();
        }
    }else{
        next({
            status: 400,
            message: `Order must have a status of ${possibleStatuses.join(', ')}`
        })
    }
}

function update(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId)
    const updatedOrder = req.body.data
    for(let prop in updatedOrder){
        if(foundOrder[prop] !== updatedOrder[prop]){
            foundOrder[prop] = updatedOrder[prop];
        }
    }
    if(!foundOrder.id){
        foundOrder.id = orderId;
    }

    res.json({data: foundOrder})
}

function checkPending(req, res, next){
    const { orderId } = req.params;
    const { status } = orders.find((order) => order.id === orderId)
    if(status !== 'pending'){
        next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`
        })
    }else{
        return next();
    }
}

function destroy(req,res,next){
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === orderId);

    orders.splice(index, 1);

    res.sendStatus(204)
}

module.exports = {
    list,
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, updateValidation, update],
    delete: [orderExists, checkPending, destroy]
}