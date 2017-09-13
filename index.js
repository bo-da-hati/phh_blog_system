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
        case '/entry/edit':
          showEditPage(req, res);
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
        case '/entry/edit':
          editEntry(req, res);
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
  //let users;
  let birthdayArray;
  let blood;
  //let blood_id = [];
  let bloodchoice;
  let bloodid;
  let resultbirthday;
  let choiceblood;
  let bloods_ary = [];
  //let bloodsAuthenticity;
  let bloods;
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
    bloodid = rows[0].blood_type_id;
    for (let i = 0; i < 3; i++) {
      bloods_ary.push(false);
    }
    if (bloodid === 1) {
      bloods_ary.unshift(true);
    } else if (bloodid === 2) {
      bloods_ary.splice(1, 0, true);
    } else if (bloodid === 3) {
      bloods_ary.splice(2, 0, true);
    } else {
      bloods_ary.push(true);
    }


    //console.log(bloodid);
    //users = rows;
    //usersnickname = rows.nickname;
    //usersbirthday = rows.birthday;
    return connection.query("SELECT * FROM blood_type");
  }).then((rows) => {
    blood = rows;
    for (let i = 0; i < blood.length; i++) {
      blood[i]["selection"] = bloods_ary[i];
    }



    // for (var row of rows) {
    //   blood.push(row.id);
    //   //bloodid.push(row.id);
    // }
    //bloodchoice = rows[0].choice_blood;


    //   return connection.query("select type from blood_type WHERE id=(?)",
    //     [
    //       id
    //     ]);
    // }).then((rows) => {
    //   blood = rows[0];//選ばれた血液（type)
    console.log(blood);
    return connection.query("select type from blood_type WHERE id=(?)",
      [
        bloodid
      ]);
  }).then((rows) => {
    choiceblood = rows[0].type;

    console.log(choiceblood);//選ばれた血液型
    return connection.query('SELECT name, nickname, type, birthday, updated_at FROM user AS p INNER JOIN blood_type AS b ON p.blood_type_id=b.id');
  }).then((rows) => {


    birthdayArray = rows[0].birthday;
    //let bt = new Date(birthdayArray);//解析
    let yearDate = birthdayArray.getFullYear();//年
    let monthDate = birthdayArray.getMonth() + 1;//月
    let dateDate = birthdayArray.getDate();//日
    //let date = bt.toLocaleDateString();//日付抜き出し（なぜか反対出力）
    let number = 0;//一桁詰めのゼロ　
    //let splitDate = date.split('/');
    //let middlebirthday = splitDate[0] + '-' + splitDate[1] + '-' + splitDate[2];
    let newbirthday;



    //let unplugDate = middlebirthday.split(dateDate + '-' + yearDate)//.push();//reverse().join("");
    if (monthDate <= 9 && dateDate <= 9) {
      newbirthday = yearDate + '-' + number + monthDate + '-' + number + dateDate
    } else if (monthDate <= 9 && dateDate >= 9) {
      newbirthday = yearDate + '-' + number + monthDate + '-' + dateDate;
    } else if (monthDate >= 9 && dateDate <= 9) {
      newbirthday = yearDate + '-' + monthDate + '-' + number + dateDate;
    } else {
      newbirthday = yearDate + '-' + monthDate + '-' + dateDate;
    }
    console.log(newbirthday);

    res.write(pug.renderFile('./includes/profile.pug', {
      profile: rows[0],
      newbirthday: newbirthday,
      blood: blood,
      //blood_id: blood_id,
      choiceblood: choiceblood

      //users: users

    }));

    connection.end(); 1
    res.end();
  }).catch((error) => {
    console.log(error);
  });;
}

// 投稿ページを表示する
function showPostPage(req, res) {
  let connection;
  let choiceUrl = "/entry/post/add";

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
        choiceUrl: choiceUrl
      }));
    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });
}
//記事の変更を行う処理
function showEditPage(req, res, edit_id, title, entry) {
  let connection;
  let choiceUrl = "/entry/edit";
  let tags;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query('SELECT * FROM tag');
  }).then((rows) => {
    tags = rows;
    //  for (var row of rows) {
    //  edit_id.push(row[0].user_id);
    //  }
    // return connection.query('select title, text from entry WHERE id=(?)',
    //   [
    //     edit_id
    //   ]);
  // }).then((rows) => {
  //   edit.push(rows);

    res.write(pug.renderFile('./includes/post.pug',
      {
        tags: tags,
        choiceUrl: choiceUrl,
        title: title,
        entry: entry
      }));
    connection.end();
    res.end();
    NeweditEntry(req, res, edit_id);
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
    let connection;





    // トップページに戻る
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;

      conn.query('INSERT INTO `entry` (`user_id`, `title`, `tag_id`, `text`) VALUES (?,?,?,?)',
        [
          1,
          title,
          tag,
          entry
        ]);
    }).then(() => {
      connection.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });


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
    let blood = parsedResult['blood']
    //let blood_type_id = parsedResult['blood'];
    let connection;
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
      connection = conn;
      return conn.query('UPDATE user SET name = ?, nickname = ?, blood_type_id = ?, birthday = ?',
        [
          name, // "'hoge'"
          nickname,
          blood,
          birthday
        ]);
      // }).then((rows) => {

      // return connection.query('UPDATE blood_type SET choice_blood = ?',//選択された血液型の情報
      // [
      // blood
      // ]);
    }).then(() => {
      connection.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}
//記事を編集する
function editEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let title = parsedResult['edit_title'];
    let entry = parsedResult['edit_text'];
    // let tag = parsedResult['tags'];
    let edit_id = parsedResult['edit_id'];
    let connection;

    //編集ページに移動（showEditPage(req, res);）
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;
    //   conn.query('UPDATE entry SET user_id = ?',
    //     [
    //       edit_id
    //     ]);

    // }).then(() => {
    //   connection.query('update entry set title = ?,text = ? where id = ?',
    //     [
    //       title,
    //       entry,
    //       edit_id
    //     ]);

    }).then(() => {
      connection.end();
      showEditPage(req, res, edit_id, title, entry);
      //res.end();
    }).catch((error) => {
      console.log(error);
    });
  });
}
//編集された記事内容とタイトルを更新する
function NeweditEntry(req, res, edit_id){
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let title = parsedResult['edit_title'];
    let entry = parsedResult['edit_text'];
    // let tag = parsedResult['tags'];
    let connection;

    
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;
    //   conn.query('UPDATE entry SET user_id = ?',
    //     [
    //       edit_id
    //     ]);

    }).then(() => {
      connection.query('update entry set title = ?,text = ? where id = ?',
        [
          title,
          entry,
          edit_id
        ]);

    }).then(() => {
      connection.end();
      res.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}