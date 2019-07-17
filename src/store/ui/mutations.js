import { cloneDeep } from "lodash";

export const SET_UI = (state, [key, value]) => {
  if (key in state.defaults) {
    state[key] = value;
  }
};

export const SET_EMBED_GAME = (state, game) => {
  state.games = [game];
  state.embed = true;
};

export const ADD_GAME = (state, game) => {
  state.games.unshift(game);
};

export const REMOVE_GAME = (state, index) => {
  state.games.splice(index, 1);
};

export const UPDATE_GAMES = (state, games) => {
  state.games = games;
};

export const UPDATE_PTN = (state, ptn) => {
  state.games[0].ptn = ptn;
};

export const SET_NAME = (state, name) => {
  state.games[0].name = name;
};

export const SET_STATE = (state, gameState) => {
  state.games[0].state = cloneDeep(gameState);
};

export const SELECT_GAME = (state, index) => {
  state.games.unshift(state.games.splice(index, 1)[0]);
};