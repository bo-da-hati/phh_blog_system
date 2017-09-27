'use strict';
const http = require('http');
const pug = require('pug');
const url = require("url");
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
      //let url2 = url.trimQuery();
      let choiceUrl = url.parse(req.url, true);//URLを解析する
      let pathname = choiceUrl.pathname//解析したURLからpathnameの部分のみ抜き出す

      switch (pathname) {
        case '/':　　　　　　//トップページ
          showTopPage(req, res);　
          break;
        case '/entry/edit':　　//記事の削除
          showEditPage(req, res);
          break;
        case '/profile':　　　//プロフィール
          showProfilePage(req, res);
          break;
        case '/entry/post':　　//記事投稿
          showPostPage(req, res);
          break;
        case '/tag':　　　　//タグ追加
          tagAddPage(req, res);
          break;
        case '/tag/genocide':　//タグの削除
          tagGenocidePage(req, res);
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
        case '/entry/edit/update':
          updateEntry(req, res)
          break;
        case '/entry/delete':
          deleteEntry(req, res);
          break
        case '/tag/add':
          tagNewEntry(req, res);
          break;
        case '/tag/delete':
          tagDeleteEntry(req, res);
          break;
        case '/entry/continue':
          continueEntry(req, res);
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
  let entries = [];
  let tags = [];
  let tag_name = [];
  let user = [];
  let next;
  let previous;
  let display = [];
  let active = [];
  let sourcePage = [];
  let pageNumber = [];
  let plusQuery;
  let pageLimit;
  let limitNumber = 5;//１ページにつく記事表示の上限を設定できる
  let created_day = [];
  let choiceUrl = url.parse(req.url, true);
  let choiceUrl2 = url.parse(req.url);
  let pageid = Number(choiceUrl.query.pageid);

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    //ページングの数を生成する（DB長さ利用）
    if (choiceUrl.query.id) {

      return connection.query("select * from entry WHERE tag_id=(?)",
        [
          choiceUrl.query.id
        ]);
    } else {
      return connection.query("SELECT * FROM entry");
    }
  }).then((rows) => {
    if (rows.length < limitNumber) {
      pageLimit = 2;
    } else {
      pageLimit = Math.ceil(rows.length / limitNumber + 1)//DBの配列の長さから記事表示上限数を表示する
    }
    //ページングにおける元となる数値を生成する(それぞれのページに与えられているページ)
    for (let i = 1; i < pageLimit; i++) {
      sourcePage.push(i);
    }
    for (let page of sourcePage) {
      pageNumber.push({
        page: page,
      });
    }
    //next要素とprevious要素を作る
    if (pageLimit === 2) {//ページが１ぺージのみしかない場合
      next = 1;
      previous = 1;
    } else if (pageid === pageLimit - 1) {//一番後ろのページにいる時の処理
      next = pageLimit - 1;
      previous = pageid - 1;
    } else if (pageid === pageLimit - (pageLimit - 1)) {//一番最初のぺージにいる時の処理
      next = pageid + 1;
      previous = 1;
    } else if (pageid) {//上記の分岐にひっかからず、pageidを持っているページの処理
      next = pageid + 1;
      previous = pageid - 1;
    } else {//pageidを持っていないつまりデフォルトのNaNの時の処理
      next = 2;
      previous = 1;
    }
    //active要素を作る
    if (pageid) {
      for (let i = 1; i < sourcePage.length; i++) {
        display.push("page-item");
      }
      display.splice(pageid - 1, 0, "page-item active");
    } else {
      for (let i = 1; i < sourcePage.length; i++) {
        display.push("page-item");
      }
      display.unshift("page-item active");
    }
    for (let i = 0; i < pageNumber.length; i++) {
      pageNumber[i]["active"] = display[i];//最終的にpageNumberに入れ込んでいる
    }
    //タグの場合か普通の場合かを分ける
    //同時にページによって表示する記事をLIMITで指定する
    if (choiceUrl.query.id) {

      plusQuery = choiceUrl.query.id;//タグの記事表示なのでクエリ文字列を投入

      if (pageid) {
        return connection.query("select * from entry WHERE tag_id=? order by created_at desc LIMIT ?, ?",//entryになってる
          [
            choiceUrl.query.id,
            (pageid - 1) * limitNumber,
            limitNumber
          ]);
      } else {
        return connection.query("select * from entry WHERE tag_id=? order by created_at desc LIMIT ?, ?",
          [
            choiceUrl.query.id,
            0,
            limitNumber
          ]);
      }
    } else {//タグかデフォルトかを判断するelse 

      plusQuery = "";//タグの記事表示ではないので空

      if (pageid) {
        return connection.query("SELECT * FROM entry order by created_at desc LIMIT ?, ?",//entryになってる
          [
            (pageid - 1) * limitNumber,//choiceUrl.query.pageid
            limitNumber
          ]);
      } else {
        return connection.query("SELECT * FROM entry order by created_at desc LIMIT ?, ?",
          [
            0,
            limitNumber
          ]);
      }
    }
  }).then((rows) => {
    entries = rows;
    //記事一覧に記事投稿をした日時を表示する処理
    for (let row of rows) {
      let created = row.created_at;
      let yearDate = created.getFullYear();//年
      let monthDate = created.getMonth() + 1;//月
      let dateDate = created.getDate();//日
      created_day.push(yearDate + '-' + monthDate + '-' + dateDate);
    }
    for (let i = 0; i < entries.length; i++) {
      entries[i]["created_day"] = created_day[i];//entriseにぶち込む
    }
    //トップページの記事一覧にその記事のタグを表示させる処理
    if (choiceUrl.query.id) {
      //タグ別に表示する時の処理
      return connection.query("select name from tag WHERE id=?",
        [
          choiceUrl.query.id,
        ]);
    } else {
      //全体で表示する時の処理
      if (pageid) {
        return connection.query('SELECT * FROM entry INNER JOIN tag ON entry.tag_id=tag.id order by created_at desc LIMIT ?, ?',
          [
            (pageid - 1) * limitNumber,
            limitNumber
          ]);
      } else {
        return connection.query('SELECT * FROM entry INNER JOIN tag ON entry.tag_id=tag.id order by created_at desc LIMIT ?, ?',
          [
            0,
            limitNumber
          ]);
      }
    }
  }).then((rows) => {
    //rowsがタグごとのページの時の処理
    if (choiceUrl.query.id) {
      for (let i = 0; i < entries.length; i++)
        tag_name.push(rows[0].name);
    } else {
      //rowsが全体で表示する時の処理
      for (let row of rows) {
        tag_name.push(row.name);
      }
    }
    for (let i = 0; i < entries.length; i++) {
      entries[i]["tag_name"] = tag_name[i];//entriseにぶち込む
    }

    return connection.query('SELECT * FROM tag');
  }).then((rows) => {
    //タグを生成する
    for (let row of rows) {
      tags.push({
        tag: row,
        query: querystring.stringify(row),
      });
    }
    return connection.query('SELECT * FROM user');
  }).then((rows) => {
    //トップページに表示するプロフィールの実装
    user = rows;

    res.write(pug.renderFile('./includes/top.pug', {
      entries: entries, //記事内容、記事を投稿した日にちを表示も追加
      tags: tags,　　　//タグ
      next: next,　　　　//nextボタン
      previous: previous,　//previousボタン
      pageNumber: pageNumber,//ページ数を表示&クエリ文字列,activeも表示
      plusQuery: plusQuery,//タグの時の場合のクエリ文字列（id)追加用
      user: user//トップページに表示するプロフィールの実装
    }));
  }).then((rows) => {
    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });
}
//タグ追加を行うページを表示する
function tagAddPage(req, res) {
  let connection;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
  }).then((rows) => {
    res.write(pug.renderFile('./includes/tag_add.pug',
      {
      }));
    connection.end();
    //res.end();
  }).catch((error) => {
    console.log(error);
  });
}
//タグを削除するページを表示する
function tagGenocidePage(req, res) {
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
    res.write(pug.renderFile('./includes/tag_delete.pug',
      {
        tags: rows
      }));
    connection.end();
    //res.end();
  }).catch((error) => {
    console.log(error);
  });
}
//ヘッダーの画像を表示する
function showHeaderPage(req, res) {
  let connection;
  let headerimg;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query("SELECT * FROM user");
  }).then((rows) => {
    headerimg = rows[0].headerimg;

    res.write(pug.renderFile('./includes/header.pug', {
      headerimg: headerimg
    }));

    connection.end();
    res.end();
  }).catch((error) => {
    console.log(error);
  });;
}

// プロフィールページを表示する
function showProfilePage(req, res) {
  let connection;
  //let users;
  // const imgUrl = img;
  let birthdayArray;
  let blood;
  //let blood_id = [];
  let bloodchoice;
  let bloodid;
  let profileimg;
  let headerimg;
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
    profileimg = rows[0].profileimg;
    headerimg = rows[0].headerimg;
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


    return connection.query("SELECT * FROM blood_type");
  }).then((rows) => {
    blood = rows;
    for (let i = 0; i < blood.length; i++) {
      blood[i]["selection"] = bloods_ary[i];
    }

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
      choiceblood: choiceblood,
      profileimg: profileimg
      //  img: img
      //users: users

    }));
    // res.write(pug.renderFile('./includes/header.pug', {
    //   headerimg: headerimg
    // }));


    connection.end();
    // showTopPage(req, res);
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
    //res.end();
  }).catch((error) => {
    console.log(error);
  });
}
//記事の変更を行う処理
function showEditPage(req, res, edit_id, title, entry, tag_id) {
  let connection;
  let choiceUrl = "/entry/edit/update";
  let tags;
  let choicename;

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

    return connection.query("select name from tag WHERE id=(?)",
      [
        tag_id
      ]);
  }).then((rows) => {
    choicename = tag_id;

    res.write(pug.renderFile('./includes/post.pug',
      {
        tags: tags,
        choiceUrl: choiceUrl,
        edit_id: edit_id,
        choicename: choicename,
        title: title,
        entry: entry
      }));
    connection.end();
    res.end();
    //updateEntry(req, res, edit_id);
  }).catch((error) => {
    console.log(error);
  });
}
//記事の続きを表示するページを表示する処理
function showContinuePage(req, res, title, text, tag_name) {
  let connection;
  let tags = [];

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then((conn) => {
    connection = conn;
    return connection.query('SELECT * FROM tag');
  }).then((rows) => {
    //タグを生成する
    for (let row of rows) {
      tags.push({
        tag: row,
        query: querystring.stringify(row),
      });
    }
    res.write(pug.renderFile('./includes/tag_continue.pug',
      {
        tags,
        title,
        text,
        tag_name
      }));
    connection.end();
    //res.end();
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
      //showTwoPage(req, res);
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
    let headerimg = parsedResult['headerimg'];
    let profileimg = parsedResult['profileimg']
    let connection;
    // トップページに戻る
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

      //connection = conn;
    }).then((conn) => {
      connection = conn;
      return conn.query('UPDATE user SET name = ?, nickname = ?, blood_type_id = ?, birthday = ?, headerimg = ?, profileimg = ?',
        [
          name, // "'hoge'"
          nickname,
          blood,
          birthday,
          headerimg,
          profileimg
        ]);
    }).then(() => {
      connection.end();
      //showProfilePage(req, res, img);
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
    let edit_id = parsedResult['edit_id'];
    let tag_id = parsedResult['edit_tagid'];
    let connection;

    //編集ページに移動（showEditPage(req, res);）
    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;
    }).then(() => {
      //connection.end();
      showEditPage(req, res, edit_id, title, entry, tag_id);
      //res.end();
    }).catch((error) => {
      console.log(error);
    });
  });
}
//編集された記事内容とタイトルを更新する
function updateEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let title = parsedResult['title'];
    let entry = parsedResult['entry'];
    let edit_id = parsedResult['edit.id'];
    let tag_id = parsedResult['tags'];
    // let tag = parsedResult['tags'];
    let connection;


    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;

    }).then(() => {
      connection.query('update entry set title = ?,text = ?,tag_id = ? where id = ?',//,tag_id = ? 
        [
          title,
          entry,
          tag_id,
          edit_id
        ]);

    }).then(() => {
      connection.end();
      //res.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}
//記事が削除された時の実装
function deleteEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let edit_id = parsedResult['edit_id'];
    //let tag = parsedResult['tags'];
    let connection;


    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;

    }).then(() => {
      connection.query('DELETE FROM entry WHERE id IN(?)',
        [
          edit_id
        ]);

    }).then(() => {
      connection.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}
//記事の続きが押された時の処理
function continueEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let title = parsedResult['entry_title'];
    let text = parsedResult['entry_text'];
    let tag_name = parsedResult['entry_tagname'];
    let connection;

    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;
    }).then(() => {
      showContinuePage(req, res, title, text, tag_name);
      //res.end();
    }).catch((error) => {
      console.log(error);
    });
  });
}
//タグを追加する際、その名前を入力するページの実装
function tagNewEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let tagname = parsedResult['tagname'];
    let connection;

    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;

      conn.query('INSERT INTO `tag` (`name`) VALUES (?)',
        [
          tagname
        ]);
    }).then(() => {
      connection.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}
//タグを削除する時の実装
function tagDeleteEntry(req, res) {
  req.on('data', (data) => {
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');

    let parsedResult = querystring.parse(decoded);
    let tag_id = parsedResult['tags'];
    let connection;


    mysql.createConnection({
      host: 'localhost',
      user: DB_USER,         // 'root'
      password: DB_PASSWD,   // ''
      database: DB_NAME,

    }).then((conn) => {
      connection = conn;

    }).then(() => {
      connection.query('DELETE FROM tag WHERE id IN(?)',
        [
          tag_id
        ]);

    }).then(() => {
      connection.end();
      showTopPage(req, res);
    }).catch((error) => {
      console.log(error);
    });
  });
}
