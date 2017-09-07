'use strict';
const http = require('http');
const pug = require('pug');
const mysql = require('promise-mysql');
const querystring = require('querystring');

const DB_NAME = 'phh_blog_system';
const DB_USER = process.env['PHH_DB_USER'] || 'root';
const DB_PASSWD = process.env['PHH_DB_PASSWD'] || '';

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });

  switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/':
          showTopPage(req, res);
          break;
        case '/profile':
          showProfilePage(req, res);
          break;
        case '/entry/post':
          showPostPage(req, res);
          break;
        default:
          res.end();
          break;
      }

      break;
    case 'POST':
      switch (req.url) {
        case '/entry/post/add':
          postNewEntry(req, res);
          break;
        case '/profile/update':
          profileNewEntry(req, res);
          break;
        default:
          res.end();
          break;
      }
      break;
    default:
      res.end();
      break;
  }
}).on('error', (e) => {
  console.error('[' + new Date() + '] Server Error', e);
}).on('clientError', (e) => {
  console.error('[' + new Date() + '] Client Error', e);
});

// HTTP サーバーを立ち上げる
const port = 8000;
server.listen(port, () => {
  console.info('[' + new Date() + '] Listening on ' + port);
});

// トップページを表示する
function showTopPage(req, res) {
  let connection;
  let entries;
  let tags = []
  //let texts = [];

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query("SELECT * FROM entry");
  }).then((rows) => {
    //for (var row of rows) {
    //texts.push([row.text]); //入力された新しいブログの記事
    //}
    entries = rows;
    return connection.query('SELECT * FROM tag');
  }).then((rows) => {
    for (let row of rows) {
      tags.push({
        tag: row,
        query: querystring.stringify(row),
      });
    }


    res.write(pug.renderFile('./includes/top.pug', {
      entries: entries, //記事内容
      tags: tags,　　　//タグ？

    }));
    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });
}

// プロフィールページを表示する
function showProfilePage(req, res) {
  let connection;
  let users;
  //let usersnickname;
  //let usersbirthday;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query("SELECT * FROM user");
  }).then((rows) => {
    //users = rows;
    //usersnickname = rows.nickname;
    //usersbirthday = rows.birthday;

    return connection.query('SELECT name, nickname, type, birthday, updated_at FROM user AS p INNER JOIN blood_type AS b ON p.blood_type_id=b.id');
  }).then((rows) => {
    res.write(pug.renderFile('./includes/profile.pug', {
      profile: rows[0],
      //users: users

    }));

    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });;
}

// 投稿ページを表示する
function showPostPage(req, res) {
  let connection;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query('SELECT * FROM tag');
  }).then((rows) => {
    res.write(pug.renderFile('./includes/post.pug',
      {
        tags: rows,
      }));
    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });
}

// 新規投稿をする
function postNewEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');


    let parsedResult = querystring.parse(decoded);
    let title = parsedResult['title'];
    let entry = parsedResult['entry'];
    let tag = parsedResult['tags'];





    // トップページに戻る
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {

      conn.query('INSERT INTO `entry` (`user_id`, `title`, `tag_id`, `text`) VALUES (?,?,?,?)',
        [
          1,
          title,
          tag,
          entry
        ]);
    }).catch((error) => {
      console.log(error);
    });

    showTopPage(req, res);
  });
}

function profileNewEntry(req, res) {//プロフィールを変更する
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');



    let parsedResult = querystring.parse(decoded);
    let name = parsedResult['name'];
    let nickname = parsedResult['nickname'];
    let birthday = parsedResult['birthday'];
    let connection;
    let bt = new Date(birthday);//解析
    let yearDate = bt.getFullYear();//年
    let monthDate = bt.getMonth();//月
    let dateDate = bt.getDate();//日
    let date = bt.toLocaleDateString();//日付抜き出し（なぜか反対出力）
    let number = 0;//一桁詰めのゼロ　
    let newbirthday;
    //let bb = new Date(newbirthday);
    //let splitDate = newbirthday.split('/');
    //let resultbirthday = splitDate[0] + '-' + splitDate[1] + '-' + splitDate[2];
    //let resultbirthday = date.replace(//g, "-");

    let splitDate = date.split('/');
    let middlebirthday = splitDate[0] + '-' + splitDate[1] + '-' + splitDate[2];


    let unplugDate = middlebirthday.split(dateDate + '-' + yearDate)//.push();//reverse().join("");
    if (monthDate < 10, dateDate < 10) {
      newbirthday = yearDate + '-' + number + unplugDate[0] + number + dateDate
    } else if (monthDate < 10, dateDate > 10) {
      newbirthday = yearDate + '-' + number + unplugDate[0] + dateDate;
    } else if (monthDate > 10, dateDate < 10) {
      newbirthday = yearDate + '-' + unplugDate[0] + number + dateDate;
    } else {
      newbirthday = yearDate + '-' + unplugDate[0] + dateDate;
    }
    //let newbirthday = yearDate + '/' + number + unplugDate[0] + number + dateDate;
    //let splitDate = newbirthday.split('/');
    //let resultbirthday = splitDate[0] + '-' + splitDate[1] + '-' + splitDate[2];





    // トップページに戻る
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

      //}).then((conn) => {

      //conn.query('INSERT INTO `user` (`name`, `nickname`, `blood_type_id`, `birthday`) VALUES (?,?,?,?)',
      // [
      //name,
      //nickname,
      //1,
      //newbirthday
      //]);
      //connection = conn;
    }).then((conn) => {

      return conn.query('UPDATE user SET name = ?, nickname = ?, blood_type_id = ?, birthday = ?',
        [
          name, // "'hoge'"
          nickname,
          1,
          newbirthday
        ]);
      connection = conn;
    }).then(() => {
      connection.end();
    }).catch((error) => {
      console.log(error);
    });

    showTopPage(req, res);
  });
}


