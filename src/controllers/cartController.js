import cartModel from "../models/cart.js";
import productModel from "../models/product.js";
import ticketModel from "../models/ticket.js";

//crear carrito
export const createCart = async (req, res) => {
    try {
        const cart = await cartModel.create({ products: [] })
        res.status(201).send(cart)
    } catch (error) {
        res.status(500).send(`Error interno del servidor al crear carrito: ${error}`)
    }
}

//mostrar carrito
export const getCart = async (req, res) => {
    try {
        const cartId = req.params.cid
        const cart = await cartModel.findOne({ _id: cartId })
       
        let productosProcesados = cart.products.map(producto => ({
            title: producto.id_prod.title,
            quantity: producto.quantity
        }));

        res.status(200).render('templates/cart', {
            productos: productosProcesados
        })
    } catch (error) {
        res.status(500).send(`Error interno del servidor al consultar carrito: ${error}`)
    }
}


//generar ticket
export const createTicket = async (req, res) => {
    try {
        // console.log(req.user)
        const cartId = req.params.cid
        const cart = await cartModel.findById(cartId)
        let prodSinStock = []
        if (cart) {
            cart.products.forEach(async (prod) => {
                let producto = await productModel.findById(prod.id_prod)
                if (producto.stock - prod.quantity < 0) {
                    prodSinStock.push(producto.id)
                }
            })
            if (prodSinStock.length == 0) {
                // const aux = [...cart.products]
                // let totalPrice = cart.products.reduce((a, b) => (a.id_prod.price * a.quantity) + (b.id_prod.price * b.quantity), 0)
                const newTicket = await ticketModel.create({
                    code: crypto.randomUUID(),
                    purchaser: req.user.email,
                    amount: 5,
                    products: cart.products
                })
                await cartModel.findByIdAndUpdate(cartId, {
                    products: []
                })
                console.log(newTicket)
                res.status(200).send(`Ticket creado correctamente: ${newTicket}`)
            } else {
                console.log(prodSinStock)
                prodSinStock.forEach((prodId) => {
                    cart.products = cart.products.filter(pro => pro.id_prod !== prodId)
                })
                await cartModel.findByIdAndUpdate(cartId, {
                    products: cart.products
                })
                res.status(400).send(`Productos sin stock: ${prodSinStock}`)
            }
        } else {
            res.status(404).send("Carrito no existe")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

//ingresar productos al carrito
export const insertProductCart = async (req, res) => {
    try {
        if (req.user.rol == "User") {
            const cartId = req.params.cid
            const productId = req.params.pid
            const { quantity } = req.body
    
            if (!quantity || isNaN(quantity)) {
                quantity = 1;
            }
            
            const cart = await cartModel.findById(cartId)
            const indice = cart.products.findIndex(product => product.id_prod.toString() === productId)
        
    
            if (indice != -1) {
                cart.products[indice].quantity += parseInt(quantity) 
            } else {
                cart.products.push({ id_prod: productId, quantity: quantity })
            }
            const mensaje = await cartModel.findByIdAndUpdate(cartId, cart)
            res.status(200).send(mensaje)
        } else {
            res.status(403).send("Usuario no autorizado")
        }
    } catch (error) {
        res.status(500).send(`Error interno del servidor al agregar producto: ${error}`)
    }
}

//actualizar el carrito
export const updateCart = async (req, res) => {
    try {
        if (req.user.rol == "User") {
            const cartId = req.params.cid;
            const { products } = req.body;
            const cart = await cartModel.findByIdAndUpdate(cartId, { products }, { new: true });
            res.status(200).send(cart);
        } else {
            res.status(403).send("Usuario no autorizado")
        }
    } catch (error) {
        res.status(500).send(`Error interno del servidor al actualizar el carrito: ${error}`);
    }
}

//actualizar la cantidad de un producto
export const updateQuantity = async (req, res) => {
    try {
        if (req.user.rol == "User") {
            const cartId = req.params.cid;
            const productId = req.params.pid;
            let { quantity } = req.body;
    
            if (!quantity || isNaN(quantity)) {
                quantity = 1;
            }
            const cart = await cartModel.findById(cartId);
            const index = cart.products.findIndex(product => product.id_prod.toString() === productId);
            if (index !== -1) {
                cart.products[index].quantity += parseInt(quantity);
                await cart.save();
                res.status(200).send(cart);
            } else {
                res.status(404).send('Producto no encontrado en el carrito');
            }
        } else {
            res.status(403).send("Usuario no autorizado")
        }
       
    } catch (error) {
        res.status(500).send(`Error interno del servidor al actualizar la cantidad del producto: ${error}`);
    }
};

//eliminar un producto del carrito
export const deleteProductCart = async (req, res) => {
    try {
        if (req.user.rol == "User") {
            const cartId = req.params.cid;
            const productId = req.params.pid;
            const cart = await cartModel.findById(cartId);
            cart.products = cart.products.filter(products => products.id_prod.toString() !== productId);
            await cart.save();
            res.status(200).send(cart);
        } else {
            req.status(403).send("Usuario no autorizado")
        }
    } catch (error) {
        res.status(500).send(`Error interno del servidor al eliminar el producto del carrito: ${error}`);
    }
}

//vaciar el carrito
export const emptyCart = async (req, res) => {
    try {
        if (req.user.rol == "User") {
            const cartId = req.params.cid;
            const cart = await cartModel.findByIdAndUpdate(cartId, { products: [] }, { new: true });
            res.status(200).send(cart);
        } else {
            res.status(403).send("Usuario no autorizado")
        }
    } catch (error) {
        res.status(500).send(`Error interno del servidor al eliminar todos los productos del carrito: ${error}`);
    }
}


