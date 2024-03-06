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

var game =new Phaser.Game(config);
var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var worldWidth = config.width * 2;

function preload() {
    //Додали асети
    this.load.image('fon+', 'assets/fon+.png');
    this.load.image('ground', 'assets/platform.png');

    //Повітряні платформи
    this.load.image('skyGroundStar', 'assets/png/tile/14.png');
    this.load.image('skyGround', 'assets/png/tile/15.png');
    this.load.image('skyGroundEnd', 'assets/png/tile/15.png');

    this.load.image('cactus', 'assets/cactus.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bush', 'assets/bush.png');
    this.load.image('stone', 'assets/stone.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    this.load.audio('collectStarSound', 'assets/collect_star.mp3');
    this.load.audio('explosionSound', 'assets/explosion.mp3');
}

function create() {
    //Додали платформу та небо
    ////this.add.image(0, 0, 'fon').setOrigin(0,0)
    this.add.tileSprite(0, 0, worldWidth, 1080, "fon+").setOrigin(0, 0);

    platforms = this.physics.add.staticGroup();
    //Створення землі на всю ширину
    for (var x = 0; x < worldWidth; x = x + 384) {
        console.log(x)
        platforms.create(x, 1080 - 93, 'ground').setOrigin(0, 0).refreshBody();
    }

    //
    objects = this.physics.add.staticGroup();

    for (var x = 0; x <= worldWidth; x = x + Phaser.Math.Between(200, 800)){
        objects.create(x, 987,'cactus').setScale(Phaser.Math.FloatBetween(0.5, 2,)).setDepth(Phaser.Math.Between(0, 2)).setOrigin(0, 1).refreshBody();
        objects.create(x, 987,'stone').setScale(Phaser.Math.FloatBetween(0.5, 2,)).setDepth(Phaser.Math.Between(0, 2)).setOrigin(0, 1).refreshBody();
        objects.create(x, 989,'bush').setScale(Phaser.Math.FloatBetween(0.5, 2,)).setDepth(Phaser.Math.Between(0, 2)).setOrigin(0, 1).refreshBody();
    }
    //Додали гравця

    player = this.physics.add.sprite(1500, 900, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(false);
    //Налаштування камери
    this.cameras.main.setBounds(0, 0, worldWidth, 1080);
    this.physics.world.setBounds(0, 0, worldWidth, 1080);
    //Додали слідкування камери за спрайтом
    this.cameras.main.startFollow(player);

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

    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    //Додали зіткнення зірок з платформою
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
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

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}