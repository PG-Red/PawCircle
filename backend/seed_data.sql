-- PawCircle 测试数据
USE pawcircle;

-- =============================================
-- 清空旧数据（按外键顺序）
-- =============================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ai_messages;
TRUNCATE TABLE ai_conversations;
TRUNCATE TABLE feeding_records;
TRUNCATE TABLE pet_listings;
TRUNCATE TABLE comments;
TRUNCATE TABLE likes;
TRUNCATE TABLE moments;
TRUNCATE TABLE pets;
TRUNCATE TABLE email_verification_codes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. 用户数据（密码均为 password 的 bcrypt hash）
-- =============================================
INSERT INTO users (id, username, email, password, avatar, bio) VALUES
(1, '金毛爱好者', 'golden@pawcircle.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://picsum.photos/seed/user1/100/100', '家有两只金毛，每天都是快乐满满'),
(2, '布偶猫舍',   'ragdoll@pawcircle.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://picsum.photos/seed/user2/100/100', '专业繁育布偶猫，温顺可爱'),
(3, '柯基控',     'corgi@pawcircle.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://picsum.photos/seed/user3/100/100', '柯基才是世界上最可爱的狗狗'),
(4, '铲屎官日记', 'diary@pawcircle.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://picsum.photos/seed/user4/100/100', '记录与猫咪的每一天'),
(5, '测试用户',   'test@pawcircle.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://picsum.photos/seed/user5/100/100', '这是一个测试账号');

-- =============================================
-- 2. 宠物档案
-- =============================================
INSERT INTO pets (id, user_id, name, breed, gender, birthday, image, description) VALUES
(1,  1, 'Max',       '金毛寻回犬',   '弟弟', '2021-05-12', 'https://picsum.photos/seed/golden/400/300',   '活泼好动，最喜欢玩飞盘，已完成所有疫苗接种'),
(2,  1, 'Buddy',     '金毛寻回犬',   '弟弟', '2022-08-20', 'https://picsum.photos/seed/golden2/400/300',  'Max 的弟弟，喜欢游泳'),
(3,  2, 'Luna',      '布偶猫',       '妹妹', '2022-02-14', 'https://picsum.photos/seed/cat3/400/300',     '蓝眼睛布偶猫，性格非常温柔，喜欢被抱'),
(4,  2, 'Mochi',     '布偶猫',       '妹妹', '2023-06-08', 'https://picsum.photos/seed/cat2/400/300',     '小月龄布偶，活泼好奇'),
(5,  3, 'Charlie',   '柯基',         '弟弟', '2020-11-05', 'https://picsum.photos/seed/corgi2/400/300',   '三岁柯基，屁股超级可爱，会握手'),
(6,  4, 'Mimi',      '英国短毛猫',   '妹妹', '2021-07-30', 'https://picsum.photos/seed/cat4/400/300',     '蓝猫，非常慵懒，每天睡20小时'),
(7,  5, 'Pepper',    '边境牧羊犬',   '妹妹', '2022-03-15', 'https://picsum.photos/seed/border/400/300',   '聪明活跃，已学会10个指令'),
(8,  1, 'Coco',      '泰迪',         '妹妹', '2023-01-20', 'https://picsum.photos/seed/poodle1/400/300',  '棕色泰迪，卷毛超可爱，不掉毛，已做美容'),
(9,  2, 'Oliver',    '橘猫',         '弟弟', '2021-09-11', 'https://picsum.photos/seed/orange_cat/400/300','标准橘猫，胖乎乎的，最爱吃罐头'),
(10, 3, 'Daisy',     '萨摩耶',       '妹妹', '2022-06-01', 'https://picsum.photos/seed/samoyed/400/300',  '微笑天使萨摩耶，毛发雪白，性格超温柔'),
(11, 4, 'Bean',      '美国短毛猫',   '弟弟', '2020-04-18', 'https://picsum.photos/seed/amshort/400/300',  '虎斑美短，精力旺盛，喜欢追激光笔'),
(12, 5, 'Rocky',     '拉布拉多',     '弟弟', '2021-12-25', 'https://picsum.photos/seed/labrador/400/300', '黑色拉布，性格憨厚，是个合格的导盲犬候选'),
(13, 1, 'Nala',      '暹罗猫',       '妹妹', '2023-03-08', 'https://picsum.photos/seed/siamese/400/300',  '暹罗猫，话很多，每天要和主人聊天'),
(14, 3, 'Duke',      '德国牧羊犬',   '弟弟', '2020-07-14', 'https://picsum.photos/seed/shepherd/400/300', '忠诚勇敢的德牧，保护欲强，已通过初级训练认证'),
(15, 4, 'Lily',      '波斯猫',       '妹妹', '2022-11-30', 'https://picsum.photos/seed/persian/400/300',  '纯白波斯猫，长毛飘逸，气质高冷但其实很粘人'),
(16, 5, 'Taro',      '柴犬',         '弟弟', '2021-08-08', 'https://picsum.photos/seed/shiba/400/300',    '柴犬弟弟，自带傲娇气场，表情包本包'),
(17, 2, 'Snowball',  '中华田园猫',   '妹妹', '2022-05-20', 'https://picsum.photos/seed/white_cat/400/300','全白田园猫，是只流浪猫救助，已绝育已驱虫'),
(18, 3, 'Biscuit',   '比熊',         '弟弟', '2023-09-05', 'https://picsum.photos/seed/bichon/400/300',   '白色比熊，像棉花糖一样，脾气超好从不咬人');

-- =============================================
-- 3. 动态数据
-- =============================================
INSERT INTO moments (id, user_id, pet_id, content, image, likes_count, comments_count, created_at) VALUES
(1,  1, 1, '今天带 Max 去公园玩，他太开心了！阳光草地飞盘，完美的一天', 'https://picsum.photos/seed/park/600/400',    12, 3, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2,  2, 3, '新来的布偶小猫 Luna，眼睛里有整片星空，太治愈了',          'https://picsum.photos/seed/cat2/600/400',    28, 5, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(3,  3, 5, 'Charlie 今天学会了新技能——装死！演技太好笑了哈哈哈',       'https://picsum.photos/seed/corgi2/600/400',   8, 2, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(4,  4, 6, 'Mimi 又把我的键盘占了... 打工人哪有猫主子重要啊',          'https://picsum.photos/seed/cat3/600/400',    15, 4, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
(5,  1, 2, 'Buddy 第一次见到雪，完全不知所措，踩一步看一步太可爱了',   'https://picsum.photos/seed/park2/600/400',   20, 6, DATE_SUB(NOW(), INTERVAL 27 HOUR)),
(6,  2, 4, 'Mochi 满月啦！小小的一团，已经开始探索世界了',             'https://picsum.photos/seed/kitten/600/400',  35, 8, DATE_SUB(NOW(), INTERVAL 48 HOUR)),
(7,  5, 7, 'Pepper 今天参加了飞球比赛，拿了第三名！为她骄傲',          'https://picsum.photos/seed/border/600/400',  18, 3, DATE_SUB(NOW(), INTERVAL 53 HOUR)),
(8,  3, 5, '周末遛柯基，遇到了5只柯基一起玩，屁股大集合现场',          'https://picsum.photos/seed/corgi/600/400',   42,10, DATE_SUB(NOW(), INTERVAL 72 HOUR)),
(9,  4, 6, '每天早上 Mimi 都要来叫我起床，然后自己去睡回笼觉',         NULL,                                          9, 1, DATE_SUB(NOW(), INTERVAL 74 HOUR)),
(10, 1, 1, 'Max 的年度体检结果出来了，一切正常！健康是最重要的',        'https://picsum.photos/seed/golden/600/400',   7, 2, DATE_SUB(NOW(), INTERVAL 96 HOUR));

-- =============================================
-- 4. 点赞数据
-- =============================================
INSERT INTO likes (user_id, moment_id) VALUES
(2,1),(3,1),(4,1),(5,1),
(1,2),(3,2),(4,2),(5,2),
(1,3),(2,3),(4,3),
(1,4),(2,4),(3,4),(5,4),
(2,5),(3,5),(4,5),(5,5),
(1,6),(3,6),(4,6),(5,6),
(1,7),(2,7),(3,7),(4,7),
(1,8),(2,8),(3,8),(4,8),(5,8),
(2,9),(3,9),(5,9),
(2,10),(3,10),(4,10);

-- =============================================
-- 5. 评论数据
-- =============================================
INSERT INTO comments (user_id, moment_id, content, created_at) VALUES
(2, 1, '好可爱！Max 看起来超级开心', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 1, '金毛真的是天使犬，太治愈了', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(4, 1, '下次也带我们去！', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1, 2, '布偶猫的眼睛真的太美了！', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(3, 2, '想摸摸 Luna 的毛', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 2, '布偶猫性格真的很好，不咬人', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 2, '在哪里买的？', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(1, 3, '哈哈哈太绝了，柯基装死都这么可爱', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(2, 3, '笑死了！！！', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(1, 4, '猫主子的地盘就是猫主子的', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(2, 4, '我家猫也是这样！！', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(3, 4, '打工人含泪点赞', DATE_SUB(NOW(), INTERVAL 15 HOUR)),
(5, 4, '建议直接把键盘让给猫', DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(2, 5, '第一次见雪的狗狗都是这个反应哈哈', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(3, 5, '好治愈！Buddy 太可爱了', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(4, 5, '下雪天遛狗一定要注意保暖', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(1, 6, '满月快乐！Mochi 以后会很漂亮的', DATE_SUB(NOW(), INTERVAL 40 HOUR)),
(3, 6, '布偶猫崽崽！！！我要！！！', DATE_SUB(NOW(), INTERVAL 38 HOUR)),
(1, 7, '第三名也很棒！Pepper 加油', DATE_SUB(NOW(), INTERVAL 50 HOUR)),
(2, 7, '边牧真的很聪明', DATE_SUB(NOW(), INTERVAL 48 HOUR)),
(1, 8, '柯基屁股大合集！！', DATE_SUB(NOW(), INTERVAL 65 HOUR)),
(2, 8, '哈哈哈太可爱了', DATE_SUB(NOW(), INTERVAL 63 HOUR)),
(4, 8, '柯基真的是团宠', DATE_SUB(NOW(), INTERVAL 60 HOUR)),
(1, 9, 'Mimi 是个小懒虫哈哈', DATE_SUB(NOW(), INTERVAL 70 HOUR)),
(2, 10, 'Max 健康才是最重要的！', DATE_SUB(NOW(), INTERVAL 90 HOUR)),
(3, 10, '要好好照顾它', DATE_SUB(NOW(), INTERVAL 88 HOUR));

-- =============================================
-- 6. 喂养记录
-- =============================================
INSERT INTO feeding_records (pet_id, user_id, type, food_name, amount, notes, created_at) VALUES
(1, 1, 'Food',  '皇家成犬粮',   '150g',  '早餐',   DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 1, 'Water', '新鲜饮水',     '300ml', NULL,     DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 1, 'Food',  '皇家成犬粮',   '150g',  '晚餐',   DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(2, 1, 'Food',  '渴望幼犬粮',   '120g',  '早餐',   DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 1, 'Water', '新鲜饮水',     '250ml', NULL,     DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(3, 2, 'Food',  '皇家猫粮',     '60g',   '早餐',   DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 2, 'Water', '流动饮水机',   '150ml', NULL,     DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 2, 'Food',  '猫条奖励',     '1根',   '训练奖励', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(5, 3, 'Food',  '比瑞吉全价粮', '100g',  '早餐',   DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(5, 3, 'Water', '新鲜饮水',     '200ml', NULL,     DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(6, 4, 'Food',  '希尔斯猫粮',   '55g',   '早餐',   DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(6, 4, 'Food',  '希尔斯猫粮',   '55g',   '晚餐',   DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(7,  5, 'Food',  '耐威克边牧粮', '180g',  '运动后补充', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(7,  5, 'Water', '新鲜饮水',     '400ml', '运动补水', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(8,  1, 'Food',  '皇家泰迪专用粮','80g',  '早餐',     DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(8,  1, 'Water', '新鲜饮水',     '150ml', NULL,       DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(9,  2, 'Food',  '主子最爱罐头', '85g',   '午餐',     DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(10, 3, 'Food',  '冻干萨摩专用', '200g',  '早餐',     DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(10, 3, 'Water', '新鲜饮水',     '350ml', NULL,       DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(12, 5, 'Food',  '皇家拉布拉多粮','160g', '早餐',     DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(16, 5, 'Food',  '柴犬专用粮',   '120g',  '早餐',     DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(16, 5, 'Water', '新鲜饮水',     '220ml', NULL,       DATE_SUB(NOW(), INTERVAL 4 HOUR));

-- =============================================
-- 7. 宠物交易数据
-- =============================================
INSERT INTO pet_listings (id, seller_id, title, category, description, price, image, location, status, created_at) VALUES
(1, 1, '纯种金毛幼犬出售', 'dog', '双血统金毛，父母均为冠军犬，性格温顺活泼，已驱虫打疫苗，有血统证书。', 3800.00, 'https://picsum.photos/seed/golden/400/300', '北京市朝阳区', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 2, '布偶猫妹妹寻新家', 'cat', '海双布偶，3月龄，已做基础检查，性格超温顺，适合有老人孩子的家庭。', 5500.00, 'https://picsum.photos/seed/cat3/400/300', '上海市浦东新区', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 3, '柯基弟弟转让',    'dog', '因本人工作调动无法继续饲养，2岁柯基，已完成训练，健康活泼，附赠全套用品。', 2000.00, 'https://picsum.photos/seed/corgi2/400/300', '广州市天河区', 'active', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 4, '英短蓝猫出售',    'cat', '纯种英短蓝猫，1岁，体型圆润，性格温顺，已绝育，有CFA证书。', 4200.00, 'https://picsum.photos/seed/cat4/400/300', '深圳市南山区', 'active', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 5, '边境牧羊犬寻新家','dog', '聪明活跃的边牧，2岁，会多项技能，需要有院子或经常运动的家庭，不适合小户型。', 2800.00, 'https://picsum.photos/seed/border/400/300', '杭州市西湖区', 'active', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 1, '金毛周边好物',    'other','金毛专用美毛梳、磨牙玩具套装、狗粮密封罐，全新未使用，因换品牌低价出。', 280.00, 'https://picsum.photos/seed/petshop/400/300', '北京市海淀区', 'active', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7, 2, '猫爬架转让',      'other','实木猫爬架，高180cm，含猫窝猫抓板，九成新，因搬家出售。', 350.00, 'https://picsum.photos/seed/cattree/400/300', '上海市静安区', 'sold',   DATE_SUB(NOW(), INTERVAL 7 DAY));

-- =============================================
-- 更新 moments 的 likes_count 和 comments_count
-- =============================================
UPDATE moments SET likes_count = (SELECT COUNT(*) FROM likes WHERE moment_id = moments.id);
UPDATE moments SET comments_count = (SELECT COUNT(*) FROM comments WHERE moment_id = moments.id);

SELECT '测试数据导入完成！' AS result;
SELECT '用户密码均为: password' AS tip;
