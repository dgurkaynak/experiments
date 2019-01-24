import anime from 'animejs';

/**
 * Just replace all `anime(params)` to `animeStepAnimator.anime(params)`,
 * then you can anime step by step by `animeStepAnimator.step()`
 */
export default class AnimeStepAnimator {
  private animations: anime.AnimeInstance[] = [];
  private stepMilliseconds: number;
  private currentTime = 0;


  constructor(private fps = 60) {
    this.stepMilliseconds = 1000 / this.fps;
  }


  step() {
    const onGoingAnimations = this.animations.filter((animeInstance) => {
      const nextTime = animeInstance.currentTime + this.stepMilliseconds;
      animeInstance.seek(nextTime);
      return nextTime < animeInstance.duration;
    });

    this.currentTime = this.currentTime + this.stepMilliseconds;
    this.animations = onGoingAnimations;
  }


  anime(params: anime.AnimeParams) {
    const animeInstance = anime(params);
    animeInstance.pause();

    this.animations.push(animeInstance);

    return animeInstance;
  }
}
