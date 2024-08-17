
const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x2uasfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
      
         client.connect()
        const productCollection = client.db("productsDB").collection("products");
  
        app.get('/products', async (req, res) => {
            try {
               
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;

               
                const searchTerm = req.query.searchTerm || '';
                const categoryFilter = req.query.category || '';
                const brandFilter = req.query.brand || '';
                const priceFilter = req.query.price || '';
                const sortOption = req.query.sort || '';

                // Build the query object
                let query = {};

                if (searchTerm) {
                    query.productName = { $regex: searchTerm, $options: 'i' };
                }

                if (categoryFilter) {
                    query.category = categoryFilter;
                }

                if (brandFilter) {
                    query.brandName = brandFilter;
                }

                if (priceFilter === 'under50') {
                    query.price = { $lt: 50 };
                } else if (priceFilter === '50To100') {
                    query.price = { $gte: 50, $lte: 100 };
                } else if (priceFilter === 'over100') {
                    query.price = { $gt: 100 };
                }

                // Sorting
                let sort = {};
                if (sortOption === 'priceLowToHigh') {
                    sort.price = 1; // Ascending
                } else if (sortOption === 'priceHighToLow') {
                    sort.price = -1; // Descending
                } else if (sortOption === 'newestFirst') {
                    sort.createdAt = -1; // Newest first
                }

                // Get total count before applying skip and limit
                const totalItems = await productCollection.countDocuments(query);

                // Fetch filtered, sorted, and paginated data
                const products = await productCollection.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                // Calculate total number of pages
                const totalPages = Math.ceil(totalItems / limit);

                // Send response with paginated data and metadata
                res.json({
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    products,
                });
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });


        
        app.get('/', (req, res) => {
            res.send('running');
        })

        
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`brand server is running on port ${port}`);
})