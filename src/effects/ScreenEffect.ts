export function flashCamera(camera: Phaser.Cameras.Scene2D.Camera, duration = 80): void {
  camera.flash(duration, 255, 255, 255)
}
