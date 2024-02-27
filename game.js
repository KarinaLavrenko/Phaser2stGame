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

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var lives = 3;
var gameOver = false;
var scoreText;
var livesText;
var timer; // Додали таймера
var game = new Phaser.Game(config);

function preload() {
    //Додали асети
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png',
        { frameWidth: 140, frameHeight: 77 }
    );
    this.load.audio('collectStarSound', 'assets/collect_star.mp3');
    this.load.audio('explosionSound', 'assets/explosion.mp3');
}

function create() {
    //Додали платформу та небо
    this.add.image(0, 0, 'sky').setPosition(0, 2.5).setScale(3.5)
    platforms = this.physics.add.staticGroup();
    platforms.create(950, 850, 'ground').setScale(3.8).refreshBody();
    platforms.create(1100, 600, 'ground').setScale(1.5);
    platforms.create(400, 450, 'ground').setScale(1.5);
    platforms.create(1550, 350, 'ground').setScale(1.5);
    //Додали гравця

    player = this.physics.add.sprite(1500, 1050, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

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
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    livesText = this.add.text(16, 50, 'Lives: ' + lives, { fontSize: '32px', fill: '#000' });
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
        player.setVelocityY(-330);
    }
}
//Додали збираня зірок
function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    //scoreText.setText('Score: ' + score);
    document.getElementById('score').innerText = score
    document.getElementById('timer').innerText = timer

    this.tweens.add({
        targets: star,
        duration: 200,
        scaleX: 0,
        scaleY: 0,
        onComplete: function () {
            star.destroy();
        }
    });
//Додали звук збирання зірок
    this.sound.play('collectStarSound');

    var x = Phaser.Math.Between(0, config.width);
    var y = Phaser.Math.Between(0, config.height);
    var bomb = bombs.create(x, y, 'bomb');
    bomb.setScale(0.25);
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
    if (lives > 0) {
        lives--;
        livesText.setText('Lives: ' + lives);
        player.setPosition(100, 450);
//Відтворення звуку
        this.sound.play('explosionSound');
    } else {
        //Завершення гри, якщо закінчилося життя
        gameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
    }
}