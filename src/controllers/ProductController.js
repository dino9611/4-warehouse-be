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
            
            // Parse data yg dikirim dari FE, karena dari FE dilakukan JSON.stringify
            const dataProduct = JSON.parse(req.body.dataProduct);
            const dataStock = JSON.parse(req.body.dataStock);
            
            // Menyiapkan array untuk insert multiple images ke MySql
            let imagePath = [];
            let path = `/assets/images/uploaded/${folderTarget}`;
            const {images} = req.files;
            images.forEach((val) => {
                imagePath.push(`"${path}/${val.filename}"`)
            })
            
            // Destructure data input produk dari FE, utk insert ke MySql
            const {
                prod_name, 
                prod_category, 
                prod_weight, 
                prod_price, 
                prod_cost, 
                prod_desc
            } = dataProduct;
            
            try {
                await conn.beginTransaction(); // Aktivasi table tidak permanen agar bisa rollback/commit permanent
    
                let sql = `INSERT INTO product SET ?`
                let addDataProd = {
                    images: `[${imagePath}]`,
                    name: prod_name,
                    category_id: prod_category,
                    weight: prod_weight,
                    price: prod_price,
                    product_cost: prod_cost,
                    description: prod_desc
                }
                const [addResult] = await conn.query(sql, addDataProd);
                const newProdId = addResult.insertId;
    
                // Utk looping insert stock, jadi semua warehouse punya record produk yg sama walaupun stok kosong
                sql = `INSERT INTO stock SET ?`;
                for (let i = 0; i < dataStock.length; i++) {
                    let addStock = {
                        warehouse_id: dataStock[i].id,
                        product_id: newProdId,
                        stock: dataStock[i].stock
                    }
                    await conn.query(sql, addStock);
                }
    
                await conn.commit(); // Commit permanent data diupload ke MySql klo berhasil
                conn.release();
                return res.status(200).send({ message: "Berhasil tambah produk" });
            } catch(error) {
                await conn.rollback(); // Rollback data klo terjadi error/gagal
                conn.release();
                console.log(error);
                return res.status(500).send({ message: error.message || "Server error" });
            };
        };
    }
}