export class GameState {
  constructor(config) {
    this.current = config.current;
    this.view = config.view;
    this.config = config.config;
  }
}
