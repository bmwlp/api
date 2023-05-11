var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = 'Fullstack-Login '

require('dotenv').config()
app.use(cors())
app.use(express.json())
const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL)

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     database: 'Projactdatabase'
// });


app.post('/register', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.C_Password, saltRounds, function (err, hash) {
        connection.execute(
            'INSERT INTO Customer (C_Email, C_Password, C_Firstname, C_Lastname , C_Address, C_Phone) VALUES (?, ?, ?, ?, ?, ?)',
            [req.body.C_Email, hash, req.body.C_Firstname, req.body.C_Lastname, req.body.C_Address, req.body.C_Phone],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', massage: err })
                    return
                }
                res.json({ status: 'ok' })
            }
        );
    });

})


app.post('/login', jsonParser, function (req, res, next) {
    connection.execute(
        'SELECT * FROM Customer WHERE C_Email = ?',
        [req.body.C_Email],
        function (err, Customer, fields) {
            if (err) { res.json({ status: 'error', massage: err }); return }
            if (Customer.length == 0) { res.json({ status: 'error', message: 'no usesr found' }); return }
            bcrypt.compare(req.body.C_Password, Customer[0].C_Password, function (err, isLogin) {
                if (isLogin) {
                    var token = jwt.sign({ C_Email: Customer[0].C_Email }, secret, { expiresIn: '1h' });
                    res.json({ status: 'ok', message: 'login successful', token })
                } else {
                    res.json({ status: 'error', message: 'login failed' })
                }
            })
            //   console.log(req.body.C_Email,req.body.C_Password);
            //   console.log(Customer)
        }
    );
})

app.post('/authen', jsonParser, function (req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1]
        var decoded = jwt.verify(token, secret);
        res.json({ status: 'ok', decoded })
    } catch (err) {
        res.json({ status: 'error', message: err.massage })
    }
})

app.get('/app/book', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook`',
        function (err, results, fields) {
            res.json(results)
        }
    );
})

app.get('/app/book/novel', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook` WHERE B_Type = "นิยาย"',
        function (err, results, fields) {
            res.json(results);
        }
    );
})



app.get('/app/book/cartoon', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook` WHERE B_Type = "การ์ตูน"',
        function (err, results, fields) {
            res.json(results);
        }
    );
})

app.get('/app/book/documentay', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook` WHERE B_Type = "สารคดี"',
        function (err, results, fields) {
            res.json(results);
        }
    );
})

app.get('/app/book/history', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook` WHERE B_Type = "ประวัติศาสตร์"',
        function (err, results, fields) {
            res.json(results);
        }
    );
})

app.get('/app/book/general', function (req, res, next) {
    connection.query(
        'SELECT * FROM `getbook` WHERE B_Type = "ความรู้ทั่วไป"',
        function (err, results, fields) {
            res.json(results);
        }
    );
})



app.post('/cart', jsonParser, function (req, res, next) {
    try {
        connection.execute(
            'INSERT INTO Book(Book_Title, Book_Type, Book_Qty, Book_Price) VALUES (?,?,?,?)',
            [req.body.Book_Title, req.body.Book_Type, req.body.Book_Qty, req.body.Book_Price],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', massage: err })
                    return
                }
                res.json({ status: 'ok' })
            }
        );
    } catch (err) {
        res.json({ status: 'error', message: err })
    }
})

app.get("/cart/:id", async (req, res) => {
    const id = req.params.id;
    try {
        connection.query(
            'SELECT B_name,B_Type,B_Price,BB_img FROM `getbook` WHERE c_id = ?', id,
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', massage: err })
                    return
                } else {
                    //res.json({ status:results[0].B_Price })
                    connection.execute(
                        'INSERT INTO Book(Book_Title, Book_Type, Book_Price ,B_img) VALUES (?,?,?,?)',
                        [results[0].B_name, results[0].B_Type, results[0].B_Price, results[0].BB_img],
                        function (err, results, fields) {
                            if (err) {
                                res.json({ status: 'error', massage: err })
                                return
                            }
                            res.json({ status: 'ok' })
                        }
                    );
                }
            }
        );
    } catch (err) {
        res.json({ status: 'error', message: err })
    }
})


app.post('/cartget', function (req, res, next) {
    connection.query(
        'SELECT * FROM `Book`',
        function (err, results, fields) {
            res.json(results);
        }
    );
})

app.delete('/deletecart', jsonParser, function (req, res, next) {
    try {
        connection.execute(
            'DELETE FROM Book WHERE Book_ID = ?',
            [req.body.Book_ID],
            function (err, results, fields) {
                if (err) {
                    res.json({ status: 'error', massage: err })
                    return
                }
                res.json({ status: 'delete success', data: results })
            }
        );
    } catch (err) {
        res.json({ status: 'error', message: err })
    }
})


app.post('/update', jsonParser, function (req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, secret);
    connection.execute(
        'UPDATE customer SET C_Firstname = ?,C_Lastname = ?, C_Address = ? ,C_Phone = ? WHERE C_Email = ?',
        [req.body.C_Firstname, req.body.C_Lastname,req.body.C_Address,req.body.C_Phone,decoded.C_Email ],
        function (err, results) {
            res.json(results);
        }
    );
})


app.get('/getuser', jsonParser, function (req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, secret);
    connection.execute(
    'SELECT C_Email,C_Firstname,C_Lastname,C_Address,C_Phone  FROM customer WHERE C_Email = ?',
        [decoded.C_Email ],
        function (err, results) {
            res.json(results);
        }
    );
})




app.listen(3334, function () {
    console.log('CORS-enabled web server listening on port 3334')
});


