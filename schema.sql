-- DB の削除と作成をする
DROP DATABASE IF EXISTS phh_blog_system;
CREATE DATABASE phh_blog_system;

USE phh_blog_system;
SET AUTOCOMMIT=0;

-- ユーザーテーブルの削除と作成をする
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
       `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, -- 主キー
       `name` VARCHAR(32),	-- ユーザー名
       `nickname` VARCHAR(32),	-- ニックネーム
       `blood_type_id` INT,	-- 血液型(blood_type テーブルの id に対応する
       `birthday` DATE,		-- 誕生日
       `headerimg` VARCHAR(100),-- ヘッダーの画像
       `profileimg` VARCHAR(100),
       -- `choiceblood`　VARCHAR(8) NOT NULL		     -- 選ばれた血液型
       `updated_at` timestamp not null default current_timestamp on update current_timestamp -- 更新日時
);
-- テストデータを挿入する
INSERT INTO `user` (`name`, `nickname`, `blood_type_id`, `birthday`, `headerimg`, `profileimg`) VALUES ("両津勘吉", "両さん", 1, '1952-3-3', 'http://i.imgur.com/QYeTiGd.jpg', 'http://www.petonlyone.com/koinu/border-collie/07.jpg');
COMMIT;

-- 血液型テーブルの削除と作成をする
DROP TABLE IF EXISTS `blood_type`;
CREATE TABLE `blood_type` (
       `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, -- 主キー
       `type` VARCHAR(8) NOT NULL		     -- 血液型
);
-- データを挿入する
INSERT INTO `blood_type` (`type`) VALUES ('A型');
INSERT INTO `blood_type` (`type`) VALUES ('Ｂ型');
INSERT INTO `blood_type` (`type`) VALUES ('ＡＢ型');
INSERT INTO `blood_type` (`type`) VALUES ('Ｏ型');
-- INSERT INTO `blood_type` (`choice_blood`) VALUES ('A型');
COMMIT;

-- 記事エントリテーブルの削除と作成をする
DROP TABLE IF EXISTS `entry`;
CREATE TABLE `entry` (
       `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, -- 主キー
       `user_id` INT NOT NULL,			     -- 投稿したユーザー ID
       `title` VARCHAR(255) NOT NULL,		     -- 記事のタイトル
       `tag_id` INT NOT NULL,			     -- タグ ID
       `text` TEXT NOT NULL,			     -- 記事の内容
       `created_at` timestamp not null default current_timestamp, -- 記事の作成日
       `updated_at` timestamp not null default current_timestamp on update current_timestamp -- 記事の更新日
);
-- テストデータを挿入する
-- INSERT INTO `entry` (`user_id`, `title`, `tag_id`, `text`) VALUES (1, "最初の記事", 1, "ドキドキするー");
-- INSERT INTO `entry` (`user_id`, `title`, `tag_id`, `text`) VALUES (1, "二番目の記事", 1, "ワクワクするー");
COMMIT;

-- タグテーブルの削除と作成をする
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
       `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, -- 主キー
       `name` VARCHAR(255) NOT NULL		     -- タグ名
);
-- データを挿入する
INSERT INTO `tag` (`name`) VALUES ('無し');
INSERT INTO `tag` (`name`) VALUES ('PHH');
INSERT INTO `tag` (`name`) VALUES ('プライベート');
COMMIT;

SET AUTOCOMMIT=1;
-- 指定された血液型を格納するだけのテーブルの削除と作成をする
-- DROP TABLE IF EXISTS `choice_blood`;
-- CREATE TABLE `choice_blood` (
--        `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, -- 主キー
--        `blood` VARCHAR(8) NOT NULL		     -- 選択された血液型
-- );
-- INSERT INTO `choice` (`blood`) VALUES ('A型');
-- COMMIT;
