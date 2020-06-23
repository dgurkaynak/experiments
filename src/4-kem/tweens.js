// Global deps:
// - TWEEN

/**
 * Infinite x-axis random animation.
 */
export function tweenX(eye) {
  if (eye._tweenX) eye._tweenX.stop();
  eye._tweenX = new TWEEN.Tween({ x: eye.rotation.x }).to(
    { x: (Math.random() - 0.5) * 1.75 },
    3000 + (Math.random() - 0.5) * 2500
  );
  eye._tweenX.onUpdate((data) => {
    eye.rotation.x = data.x;
  });
  // eye._tweenX.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenX.onComplete(() => tweenX(eye));
  eye._tweenX.start();
}

/**
 * Inifinite y-axis random animations
 */
export function tweenY(eye) {
  if (eye._tweenY) eye._tweenY.stop();
  eye._tweenY = new TWEEN.Tween({ y: eye.rotation.y }).to(
    { y: (Math.random() - 0.5) * 1.75 },
    3000 + (Math.random() - 0.5) * 2500
  );
  eye._tweenY.onUpdate((data) => {
    eye.rotation.y = data.y;
  });
  // eye._tweenY.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenY.onComplete(() => tweenY(eye));
  eye._tweenY.start();
}

/**
 * Infinite z-axis random animation
 */
export function tweenZ(eye) {
  if (eye._tweenZ) eye._tweenZ.stop();
  eye._tweenZ = new TWEEN.Tween({ z: eye.rotation.z }).to(
    { z: (Math.random() - 0.5) * 0.5 },
    1000 + (Math.random() - 0.5) * 500
  );
  eye._tweenZ.onUpdate((data) => {
    eye.rotation.z = data.z;
  });
  eye._tweenZ.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenZ.onComplete(() => tweenZ(eye));
  eye._tweenZ.start();
}

/**
 * Stops all the animations (x,y,z axes) and looks at the camera.
 */
export function tweenToCamera(eye) {
  if (eye._tweenX) eye._tweenX.stop();
  if (eye._tweenY) eye._tweenY.stop();
  if (eye._tweenZ) eye._tweenZ.stop();

  eye._tweenToCamera = new TWEEN.Tween({
    x: eye.rotation.x,
    y: eye.rotation.y,
    z: eye.rotation.z,
  }).to(eye._rotationToCamera, 500);

  eye._tweenToCamera.easing(TWEEN.Easing.Elastic.Out);
  eye._tweenToCamera.onUpdate((data) => {
    eye.rotation.x = data.x;
    eye.rotation.y = data.y;
    eye.rotation.z = data.z;
  });
  eye._tweenToCamera.onComplete(() => {
    setTimeout(() => {
      tweenX(eye);
      tweenY(eye);
      tweenZ(eye);
    }, 1000);
  });
  eye._tweenToCamera.start();
}
