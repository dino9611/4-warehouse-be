const { connection } = require("../connection");
const fs = require("fs");

module.exports = {
    getProdCategory: async (req, res) => {
        console.log("Jalan /product/category");
        const conn = await connection.promise().getConnection();

        try {
            let sql = `SELECT id, category FROM category;`;

            const [categoryResult] = await conn.query(sql);

            conn.release();
            return res.status(200).send(categoryResult);
        } catch (error) {
            conn.release();
            console.log(error);
            return res.status(500).send({ message: error.message || "Server error" });
        };
    },
    addProduct: (folderTarget) => {
        return async (req, res) => {
            console.log("Jalan /product/add");
            const conn = await connection.promise().getConnection();
    
            const dataProduct = JSON.parse(req.body.dataProduct);
            const dataStock = JSON.parse(req.body.dataStock);
    
            // console.log("Line 32 dataProd: ", dataProduct);
            // console.log("Line 33 dataStok: ", dataStock);
    
            // ! Sebellum upload pastikan image[0] ada di frontend, ato ga nnti image ke [1] nnti jadi [0], di frontend harus proteksi, biar di database juga bagus
    
            let imagePath = [];
            let path = `/assets/images/uploaded/${folderTarget}`;
            const {images} = req.files;
    
            images.forEach((val, index) => {
                imagePath.push(`${path}/${val.filename}`)
            })
            
            console.log(imagePath);
    
            const {
                prod_name, 
                prod_category, 
                prod_weight, 
                prod_price, 
                prod_cost, 
                prod_desc
            } = dataProduct;
    
            // const {
            //     wh_id_01,
            //     stock_01,
            //     wh_id_02,
            //     stock_02,
            //     wh_id_03,
            //     stock_03
            // } = req.body[2];
            // console.log("Input 1:", req.body[0]);
            // console.log("Input 2:", req.body[1]);
            // console.log("Input 3:", req.body[2]);
    
            return res.status(200).send({
                message: "Berhasil test upload + image",
                lihatIsi: req.files
            });
            
            // try {
            //     await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent
    
            //     let sql = `INSERT INTO product SET ?`
            //     let addDataProd = {
            //         name: prod_name,
            //         category_id: prod_category,
            //         weight: prod_weight,
            //         price: prod_price,
            //         product_cost: prod_cost,
            //         description: prod_desc
            //     }
            //     const [addResult] = await conn.query(sql, addDataProd)
            //     console.log(addResult);
            //     console.log("Insert ID:", addResult.insertId);
            //     const newProdId = addResult.insertId;
    
            //     // Utk looping insert stock, jadi semua warehouse punya produk yg sama walaupun stok kosong
            //     let whIdLoop = [wh_id_01, wh_id_02, wh_id_03];
            //     let stockLoop = [stock_01, stock_02, stock_03];
            //     sql = `INSERT INTO stock SET ?`
    
            //     for (let i = 0; i < stockLoop.length; i++) {
            //         let addStock = {
            //             warehouse_id: whIdLoop[i],
            //             product_id: newProdId,
            //             stock: stockLoop[i]
            //         }
            //         const [addStockResult] = await conn.query(sql, addStock);
            //         console.log(`Query ${i + 1}`, addStockResult);
            //     }
    
            //     await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
            //     conn.release();
            //     return res.status(200).send({ message: "Berhasil tambah produk" });
            // } catch(error) {
            //     await conn.rollback(); // Rollback data klo terjadi error/gagal
            //     conn.release();
            //     console.log(error);
            //     return res.status(500).send({ message: error.message || "Server error" });
            // };
        }
    }
}