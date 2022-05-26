const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const req = require("express/lib/request");
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




app.get('/', (req, res) => {
    res.send('running electronic server');
})


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.evbfx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.33stp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    try {
        await client.connect();
        const ToolsCollections = client.db('ElectronicTools').collection('tools');
        const MyItemCollection = client.db('ElectronicTools').collection('myItemOrder');
        const MyReviewCollection = client.db('ElectronicTools').collection('review');
        const userCollection = client.db('ElectronicTools').collection('users');



        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })


        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });
      
          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          })
      
          app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'});
            }
      
          })
      
          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          })


          
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = ToolsCollections.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/Browstools', async (req, res) => {
            const query = {};
            const cursor = ToolsCollections.find(query);
            const tools = await cursor.limit(6).toArray();
            res.send(tools);
        })

        app.get('/Browstools/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const tools = await ToolsCollections.findOne(query);
            res.send(tools);
        })
        app.get('/myorder/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const tools = await MyItemCollection.findOne(query);
            res.send(tools);
        })


        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const tools = await ToolsCollections.findOne(query);
            res.send(tools);
        })

        app.post('/tools', async (req, res) => {
            const newtools = req.body;
            const result = await ToolsCollections.insertOne(newtools);
            res.send(result);
        })
        app.get('/review', async (req, res) => {
            const order = req.body;
            const cursor = await MyReviewCollection.find().toArray();
          
            res.send(cursor);
        })
        app.post('/review', async (req, res) => {
            const newProduct = req.body;
            const result = await MyReviewCollection.insertOne(newProduct);
            res.send(result);
        })
        // app.get('/review', async (req, res) => {
        //     const id = req.params.id;

        //     const query = { _id: ObjectId(id) };
        //     const tools = await MyReviewCollection.findOne(query);
        //     res.send(tools);
        // })
        // app.post('/review', async (req, res) => {
        //     const newtools = req.body;
        //     const result = await MyReviewCollection.insertOne(newtools);
        //     res.send(result);
        // })



        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity,
                }
            };
            const result = await ToolsCollections.updateOne(filter, updatedDoc, options);
            res.send(result);

        })

        app.put('/Browstools/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity,
                }
            };
            const result = await ToolsCollections.updateOne(filter, updatedDoc, options);
            res.send(result);

        })

        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity,
                }
            };
            const result = await ToolsCollections.updateOne(filter, updatedDoc, options);
            res.send(result);

        })


        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ToolsCollections.deleteOne(query);
            res.send(result);
        });

        app.delete('/myorder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await MyItemCollection.deleteOne(query);
            res.send(result);
        });


        app.get('/booking', async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const bookings = await MyItemCollection.find(query).toArray();
                // const cursor = orderCollection.find(query);
                // const orders = await cursor.toArray();
                res.send(bookings);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        app.post('/myorder', async (req, res) => {
            const order = req.body;

            // res.send(result);

            const booking = req.body;
            const query = { product: booking.product, email: booking.email }
            const exists = await MyItemCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            // const result = await MyItemCollection.insertOne(booking);
            const result = await MyItemCollection.insertOne(order);
            return res.send({ success: true, result });
        })
        app.get('/myorder', async (req, res) => {
            const order = req.body;
            const result = await MyItemCollection.find().toArray();
            res.send(result);
           
        })

        // app.delete('/myorder/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) }
        //     const result = await MyItemCollection.deleteOne(query);
        //     res.send(result);
        // });


        app.get('/available', async (req, res) => {
            const date = req.query.product;
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const services = await ToolsCollections.find().toArray();


            // const query = {email: email};
            // const bookings = await MyItemCollection.find(query).toArray();


            // services.forEach(service=>{

            //   const serviceBookings = bookings.filter(book => book.product === service.name);

            //   const bookedSlots = serviceBookings.map(book => book.product);

            //   const available = service.slots.filter(slot => !bookedSlots.includes(slot));

            //   service.slots = available;
            // });


            res.send(services);
        })

        /**
         * API Naming Convention
         * app.get('/booking') // get all bookings in this collection. or get more than one or by filter
         * app.get('/booking/:id') // get a specific booking 
         * app.post('/booking') // add a new booking
         * app.patch('/booking/:id) //
         * app.delete('/booking/:id) //
        */

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await MyItemCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { product: booking.product, email: booking.email }
            const exists = await MyItemCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await MyItemCollection.insertOne(booking);
            return res.send({ success: true, result });
        })




    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running electronic Server');
});

app.get('/hero', (req, res) => {
    res.send('Hero meets hero ku')
})

app.listen(port, () => {
    console.log('listening to port', port);
})
