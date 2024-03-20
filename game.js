var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: game,
    playerSpeed: 200,
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

var game = new Phaser.Game(config);
var player;
var stars;
var enemyCount;
var enemy;
var bombs;
var platforms;
var reloadButton;
var cursors;
var lives = 3;
var score = 0;
var gameOver = false;
var scoreText;
var livesText;
var worldWidth = config.width * 2;
var playerSpeed = 1000
var collectStarSound; // Оголошуємо змінну для збереження звуку

function preload() {
    //Додали асети
    this.load.image('fon+', 'assets/fon+.png');
    this.load.image('ground', 'assets/platform.png');

    //Повітряні платформи
    this.load.image('14', 'assets/14.png');
    this.load.image('15', 'assets/15.png');
    this.load.image('16', 'assets/16.png');

    this.load.image('cactus', 'assets/cactus.png');
    this.load.image('enemy', 'assets/enemy.png',
            { frameWidth: 32, frameHeight: 48 });
    this.load.image('star', 'assets/star.png');
    this.load.image('bush', 'assets/bush.png');
    this.load.image('stone', 'assets/stone.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('reloadButton', 'assets/reloadButton.png');
    this.load.spritesheet('dude', 'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    this.load.audio('collectHeartSound', 'assets/collect_heart.mp3');
    this.load.audio('collectStarSound', 'assets/collect_star.mp3');
    this.load.audio('explosionSound', 'assets/explosion.mp3');
}

function create() {
    //Створюємо фон плиткою
    this.add.tileSprite(0, 0, worldWidth, 1080, "fon+")
        .setOrigin(0, 0)
        .setScale(1)
        .setDepth(0);


    scoreText = this.add.text(100, 100, 'Score: 0', { fontSize: '32px', fill: '#FFF' })
    scoreText.setOrigin(0, 0)
        .setScrollFactor(0);

    enemyText = this.add.text(300, 50, showTextSymbols('👾', enemyCount), { fontSize: '32px', fill: '#FFF' })
    enemyText.setOrigin(0, 0)
        .setScrollFactor(0);

    livesText = this.add.text(1500, 100, showTextSymbols('💖', lives), { fontSize: '32px', fill: '#FFF' })
    livesText.setOrigin(0, 0)
        .setDepth(10)
        .setScrollFactor(0);

    reloadButton = this.add.image(700, 500, 'reloadButton')
    reloadButton.setOrigin(0, 0)
        .setDepth(10)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', function () {
            // Перезавантаження гри
            location.reload();
        });

    reloadButton.setVisible(false); // Початково ховаємо кнопку

    enemy = this.physics.add.group({
        key: 'enemy',
        repeat: enemyCount,
        setXY: { x: 1000, y: 1080 - 150, stepX: Phaser.Math.FloatBetween(300, 500) }
    });

    //Додаємо платформи
    platforms = this.physics.add.staticGroup();
    //Створення землі на всю ширину
    for (var x = 0; x < worldWidth; x = x + 384) {
        //console.log(x)
        platforms
            .create(x, 1080 - 93, 'ground')
            .setOrigin(0, 0)
            .setDepth(100)
            .refreshBody();
    }

    //
    objects = this.physics.add.staticGroup();

    for (var x = 0; x <= worldWidth; x = x + Phaser.Math.Between(300, 500)) {
        objects
            .create(x, 987, 'cactus')
            .setScale(Phaser.Math.FloatBetween(0.5, 2,))
            .setDepth(Phaser.Math.Between(0, 2))
            .setOrigin(0, 1)
            .refreshBody();
        objects
            .create(x, 987, 'stone')
            .setScale(Phaser.Math.FloatBetween(0.5, 2,))
            .setDepth(Phaser.Math.Between(0, 2))
            .setOrigin(0, 1).refreshBody();
        objects
            .create(x, 989, 'bush')
            .setScale(Phaser.Math.FloatBetween(0.5, 2,))
            .setDepth(Phaser.Math.Between(0, 2))
            .setOrigin(0, 1)
            .refreshBody();
    }

    //Додали гравця
    player = this.physics.add.sprite(1500, 900, 'dude');
    player
        .setBounce(0.2)
        .setCollideWorldBounds(false)
        .setDepth(5)
    //Налаштування камери
    this.cameras.main.setBounds(0, 0, worldWidth, 1080);
    this.physics.world.setBounds(0, 0, worldWidth, 1080);
    //Додали слідкування камери за спрайтом
    this.cameras.main.startFollow(player);

    enemy.children.iterate((child) => {
        if (Math.random() < 0.05) {
            child.setVelocityX(Phaser.Math.FloatBetween(-500, 500))
        }
    })


    //Додаємо об'єкти випадковим чином на всю ширину екрана
    var x = 0;
    while (x < worldWidth) {
        var y = Phaser.Math.FloatBetween(540, 1080); // Змінили діапазон висоти платформ
        platforms.create(x, y, 'ground').setScale(0.5).refreshBody(); // Зменшели масштаб платформ
        x += Phaser.Math.FloatBetween(200, 700); // Збільшели відстань між платформами
    }


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

    stars = this.physics.add.group({
        key: 'star',
        repeat: 111,
        setXY: { x: 12, y: 0, stepX: 90 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    hearts = this.physics.add.group({
        key: 'heart',
        repeat: 111,
        setXY: { x: 12, y: 0, stepX: 150 }
    });

    hearts.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });


    bombs = this.physics.add.group();

    //Додали зіткнення зірок з платформою
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(hearts, platforms);
    this.physics.add.collider(enemy, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.overlap(player, player, null, this);
    this.physics.add.overlap(player, enemy, null, this);
    this.physics.add.collider(player, hearts, collectHeart, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);


    for (var x = 0; x < worldWidth; x = x + Phaser.Math.Between(400, 500)) {
        var y = Phaser.Math.Between(100, 700)

        platforms.create(x, y, '14');

        platforms.create(x + 128, y, '15');

        platforms.create(x + 128 * 2, y, '16');
    }
    hearts = this.physics.add.group({
        key: 'heart',
        repeat: 5,
        setXY: { x: 12, y: 0, stepX: 300 }
    });

    hearts.children.iterate(function (heart) {
        heart.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(player, hearts, collectHeart, null, this);
}

function update() {

    if (Math.abs(player.x - enemy.x) < 600) {
        enemy.moveTo(player, player.x, player.y, 300, 1)
    }

    enemy.children.iterate(function (child) {
        child
            .setCollideWorldBounds(true)
            .setVelocityX(Phaser.Math.FloatBetween(-500, 500))
    })

    if (gameOver) {
        return;
    }
    //Додали керування персонажем
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-480);
    }
    {
        if (gameOver) {
            return;
        }

        // Перевіряємо, чи життя рівне нулю, і показуємо кнопку
        if (lives === 0) {
            reloadButton.setVisible(true);
        }

    }

}
//Додали збираня зірок
function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);

    //Додали звук збирання зірок
    this.sound.play('collectStarSound');

    var x = Phaser.Math.Between(0, config.width);
    var y = Phaser.Math.Between(0, config.height);
    var bomb = bombs.create(x, y, 'bomb');
    bomb.setScale(1);
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
    }
}

function collectHeart(player, heart) {
    heart.disableBody(true, true);
    lives += 1; // Змінюємо здоров'я на +1

    // Додамо звук збирання сердечка
    this.sound.play('collectHeartSound');
}
var isHitByBomb = false;


function hitBomb(player, bomb) {
    if (isHitByBomb) {
        return;
    }

    isHitByBomb = true;

    lives = lives - 1;
    livesText.setText(showlives());

    var direction = (bomb.x < player.x) ? 1 : -1;
    bomb.setVelocityX(300 * direction);

    player.setTint(0xff0000);

    this.time.addEvent({
        delay: 1000,
        callback: function () {
            player.clearTint();
            isHitByBomb = false;

            if (lives === 0) {
                gameOver = true;
                reloadButton.setVisible(true); // Показуємо кнопку перезавантаження
                this.physics.pause();
                player.anims.play('turn');
            }
        },
        callbackScope: this,
        loop: false
    });
}


function showTextSymbols(symbol,count) {
    var symbolLine = ''

    for (var i = 0; i < count; i++) {
        symbolLine = symbolLine + symbol
    }

    return symbolLine
}