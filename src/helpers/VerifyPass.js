const { connection } = require("./../connection");
const hashPass = require("./index");

const verifyPass = async (req, res, next) => {
    const {username, pass} = req.headers;

    // console.log(req.params.prodId);
    // console.log(username);
    // console.log(pass);
    
    const conn = await connection.promise().getConnection();

    try {
        let sql = `
            SELECT username FROM user 
            WHERE username = ? AND password = ?;
        `;
        const [result] = await conn.query(sql, [
            username,
            pass
            // ! Khusus sesi testing gunakan tanpa hash karena blm byk dummy data password nya pake hashpass, dapat menyebabkan salah matching password dgn db
            // hashPass(pass) 
        ]);

        if (!result.length) {
            conn.release();
            console.log("The user provided wrong password");
            return res.send({validationMessage: "Incorrect Password!"})
        } else {
            conn.release();
            next();
        };
    } catch (error) {
        conn.release();
        console.log(error);
        return res.status(500).send({ message: error.message || "Server Error" });
    }
}

module.exports = verifyPass;