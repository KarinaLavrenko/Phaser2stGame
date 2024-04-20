var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: game,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var reloadButton;
var lifeLine = ''
var life = 3;
var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var lifeText;
var game = new Phaser.Game(config);
var worldWidth = 9600;
var playerSpeed = 1000
var fire;
var enemy;
var enemyCount = 10
var enemyText
var symbolLine
var symbol
var TextSymbols
var bulletts
var fireRate = 200;
var lastFired = 0;

function preload() {
    //Додали асети
    this.load.image('bush', 'assets/bush.png');
    this.load.image('fon+', 'assets/fon+.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    //Повітряні платформи
    this.load.image('14', 'assets/14.png');
    this.load.image('15', 'assets/15.png');
    this.load.image('16', 'assets/16.png');
    this.load.image('Skeleton', 'assets/Skeleton.png');
    this.load.image('Tree', 'assets/Tree.png');
    this.load.image('reloadButton', 'assets/reloadButton.png');
    this.load.image('heart', 'assets/life.png');
    this.load.image('enemy', 'assets/zombie.png');
    this.load.image('fire', 'assets/bullet1.png')

    this.load.audio('collectHeartSound', 'assets/collect_heart.mp3');
    this.load.audio('collectStarSound', 'assets/collect_star.mp3');
    this.load.audio('explosionSound', 'assets/explosion.mp3');
}

function create() {

    //Створюємо фон плиткую
    this.add.tileSprite(0, 0, worldWidth, 1080, "fon+").setOrigin(0, 0);
    platforms = this.physics.add.staticGroup();
    //Створюємо землю на всю ширину екрану
    for (var x = 0; x < worldWidth; x = x + 340) {
        console.log(x)
        platforms.create(x, 1080 - 83, 'ground')
            .setOrigin(0, 0)
            .refreshBody();
    }
    //Додаємо кущі
    bush = this.physics.add.staticGroup();
    createWorldObjects(bush, 'bush')

    Skeleton = this.physics.add.staticGroup();
    createWorldObjects(Skeleton, 'Skeleton')

    Tree = this.physics.add.staticGroup();
    createWorldObjects(Tree, 'Tree')


    reloadButton = this.add.image(700, 500, 'reloadButton')
    reloadButton.setOrigin(0, 0)
        .setDepth(10)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', function () {
            // Перезавантаження гри
            location.reload();
        });
    // Початково ховаємо кнопку
    reloadButton.setVisible(false);

    player = this.physics.add.sprite(1500, 900, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    //Налаштування камери
    this.cameras.main.setBounds(0, 0, worldWidth, 1080);
    this.physics.world.setBounds(0, 0, worldWidth, 1080);
    //Слідкування камери за гравцем
    this.cameras.main.startFollow(player);

    //Додаємо платформи випадковим чином
    for (var x = 0; x < worldWidth; x = x + Phaser.Math.Between(800, 1000)) {
        var y = Phaser.Math.Between(550, 810)

        platforms.create(x, y, '14')
        var i
        for (i = 1; i <= Phaser.Math.Between(1, 5); i++) {
            platforms.create(x + 128 * i, y, '15')
        }

        platforms.create(x + 128 * i, y, '16')
    }


    //Додали гравця
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //Додали курсор
    cursors = this.input.keyboard.createCursorKeys();
    //Додали зірки
    stars = this.physics.add.group({
        key: 'star',
        repeat: 111,
        setXY: { x: 12, y: 0, stepX: 90 }
    });

    stars.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)).setScale(1);

    });
    bombs = this.physics.add.group();
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '50px', fill: '#ffffff' })
        .setOrigin(0, 0)
        .setScrollFactor(0);

    //Додали життя
    lifeText = this.add.text(1700, 16, showLife(), { fontSize: '32px', fill: '#ffffff' })
        .setOrigin(1, 0)
        .setScrollFactor(0);
    heart = this.physics.add.group({
        key: 'heart',
        repeat: 10,
        setXY: { x: 12, y: 0, stepX: Phaser.Math.FloatBetween(1000, 2500) }
    });
    heart.children.iterate(function (child) {
        child.setScale(0.07);
    });

    heart.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    //Додали зіткнення зірок з платформою
    this.physics.add.collider(heart, platforms);
    this.physics.add.overlap(player, heart, collectHeart, null, this);
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    this.physics.add.collider(player, enemy, () => {
        player.x = player.x + Phaser.Math.FloatBetween(-200, 200);
    }, null, this);
    //Додали ворога
    enemy = this.physics.add.group({
        key: 'enemy',
        repeat: enemyCount - 1,
        setXY: { x: 1000, y: 1080 - 150, stepX: Phaser.Math.FloatBetween(300, 500) }
    })
    enemy.children.iterate(function (child) {
        child
            .setCollideWorldBounds(true)
            .setVelocityX(Phaser.Math.FloatBetween(-500, 500))
    });
    this.physics.add.collider(player, enemy, () => {
        player.x = Phaser.Math.FloatBetween(-200, 200);

    }, null, this);
    //Рахунок ворогів
    enemyText = this.add.text(45, 70, showTextSymbols('👾', enemyCount), { fontSize: '40px', fill: '#FFF' })
        .setOrigin(0, 0)
        .setScrollFactor(0)
    this.physics.add.collider(enemy, platforms);


    //Додали пулі
    bullets = this.physics.add.group();
    this.physics.add.collider(bullets, platforms);
    this.physics.add.collider(bullets, enemy, bulletEnemyCollisionHandler);
    this.physics.add.collider(bullets, bombs, bulletEnemyCollisionHandler);


}


function update() {
    if (Math.abs(player.x - enemy.x) < 600) {
        enemy.moveTo(player, player.x, player.y, 300, 1)
    }
    //
    enemy.children.iterate((child) => {
        if (Math.random() < 0.01) {
            child.setVelocityX(Phaser.Math.FloatBetween(-500, 500))
        }
    })

    if (gameOver) {
        return;
    }
    //Додали керування персонажем
    if (cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);

        player.anims.play('turn');
    }
    {
        if (gameOver) {
            return;
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-480);
        }
        // Перевірка натискання клавіші пробіл та інтервалу між пострілами
        if (cursors.space.isDown && (this.time.now > lastFired + fireRate)) {
            fireBullet();
            lastFired = this.time.now;

        }
    }


    if (cursors.space.isDown && !fire) {
        // Запускаємо пулю лише якщо вона ще не існує
        fire = this.physics.add.sprite(player.x, player.y, 'fire');
        fire.setScale(0.009).setVelocityX(player.body.velocity.x * 2);
        fire.body.setBounce(1);
        // Колізія пулі з ворогом
        this.physics.add.collider(fire, enemy, function (fire, enemy) {
            // Відключаємо пулю та ворога
            fire.disableBody(true, true);
            enemy.disableBody(true, true);
            fire = null; // Очищуємо посилання на пулю
        });

        // Колізія пулі з платформами
        this.physics.add.collider(fire, platforms);

        // Додавання колайдеру пуль з ворогами
        // enemy = this.physics.add.group();
        this.physics.add.collider(bullets, enemy, bulletEnemyCollisionHandler);
    }

}
function fireBullet() {
    // Створення пулі
    fire = bullets.create(player.x, player.y, 'fire');
    fire.setScale(0.1).setVelocityX(player.body.velocity.x * 2);
    // Встановлюємо затримку перед відключенням пулі через 3000 мілісекунд (3 секунди)
    setTimeout(() => {
        fire.disableBody(true, true);
    }, 3000);
}

function bulletEnemyCollisionHandler(bullet, enemy) {
    // Логіка, що відбувається при зіткненні пулі з ворогом
    bullet.disableBody(true, true);
    enemy.disableBody(true, true); // Вимкнення ворога
    enemyCount -= 1
    enemyText.setText(showTextSymbols('👾', enemyCount))
}
//Додали збирання зірок
function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    //Додали звук збирання зірок
   

    
    var x = Phaser.Math.Between(0, worldWidth);
    var y = Phaser.Math.Between(0, config.height);
    var bomb = bombs.create(x, 0, 'bomb');
    bomb.setScale(1);
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    if (stars.countActive(true) === 0)
    {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
    }
}

function hitBomb(player, bomb) {
    bomb.disableBody(true, true);
    isHitByBomb = true;

    life -= 1
    lifeText.setText(showLife())

    if (life === 0) {
        reloadButton.setVisible(true);
        gameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
    }
}

function showLife() {
    var lifeLine = ''

    for (var i = 0; i < life; i++) {
        lifeLine = lifeLine + '💖'
    }
    return lifeLine
}

//Додалт кущі випадковим чином
function createWorldObjects(object, asset) {
    for (var x = 0; x < worldWidth; x = x + Phaser.Math.FloatBetween(500, 1000)) {
        var y = 1000;
        console.log(x, y);
        bush.create(x, y, asset)
            .setScale(Phaser.Math.FloatBetween(0.3, 2))
            .setOrigin(0, 1)
            .setDepth(Phaser.Math.FloatBetween(1, 10))
            .refreshBody();
    }
}

function collectHeart(player, heart) {
    heart.disableBody(true, true);

    life += 1;

    lifeText.setText(showLife());

    console.log(life)
}

function showTextSymbols(symbol, count) {
    var symbolLine = ''

    for (var i = 0; i < count; i++) {
        symbolLine = symbolLine + symbol
    }

    return symbolLine
}