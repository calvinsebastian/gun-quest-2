export class SpriteAnimation {
  constructor(image, frameWidth, frameHeight) {
    this.image = image; // Image object
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animations = {}; // Holds different animations
    this.currentAnimation = null;
  }

  addAnimation(name, frameCount, frameDuration) {
    this.animations[name] = {
      frameCount,
      frameDuration,
      currentFrame: 0,
      elapsedTime: 0,
    };
  }

  setAnimation(name) {
    if (this.animations[name]) {
      this.currentAnimation = name;
      this.animations[name].currentFrame = 0;
      this.animations[name].elapsedTime = 0;
    }
  }

  update(deltaTime) {
    if (this.currentAnimation) {
      const anim = this.animations[this.currentAnimation];
      anim.elapsedTime += deltaTime;
      if (anim.elapsedTime >= anim.frameDuration) {
        anim.elapsedTime -= anim.frameDuration;
        anim.currentFrame = (anim.currentFrame + 1) % anim.frameCount;
      }
    }
  }

  draw(ctx, x, y) {
    if (this.currentAnimation) {
      const anim = this.animations[this.currentAnimation];
      const sx = anim.currentFrame * this.frameWidth;
      const sy = 0; // Assuming single row of animations
      ctx.drawImage(
        this.image,
        sx,
        sy,
        this.frameWidth,
        this.frameHeight,
        x,
        y,
        this.frameWidth,
        this.frameHeight
      );
    }
  }
}
