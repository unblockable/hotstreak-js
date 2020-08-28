import { denormalize, normalize, schema } from 'normalizr';

const league = new schema.Entity('leagues');
const player = new schema.Entity('players');
const team = new schema.Entity('teams');

const participant = new schema.Entity('participant', {
  player
});
const opponent = new schema.Entity('opponents', {
  participants: [participant],
  team
});
const prediction = new schema.Entity('predictions', {
  participant
});

const game = new schema.Entity('games', {
  league,
  opponents: [opponent],
  predictions: [prediction]
});

class Store {
  entities = {};

  pushGames(games) {
    const { entities, result } = normalize(games, [game]);
    this.entities = entities;
    return { entities, games: result };
  }

  pushPredictions(predictions, gameId) {
    const gameIds = Object.keys(this.entities.games);
    const games = denormalize(gameIds, [game], this.entities);

    games.forEach(game => {
      if (game.id === gameId) {
        const parsedPredictions = predictions.map(this._parsePrediction);
        game.predictions = parsedPredictions;
      }
    });

    const { entities } = normalize(games, [game]);
    this.entities = entities;
  }

  _parsePrediction(prediction) {
    const [affinity, signature] = prediction;
    const [predictionComponents] = signature.split(':');
    const [
      participantId,
      beginClock,
      endClock,
      line,
      overProbability,
      statCategory,
      predictedAt
    ] = predictionComponents.split(',');

    return {
      id: `${participantId}:${statCategory}`,
      affinity,
      beginClock: parseInt(beginClock),
      endClock: parseInt(endClock),
      line: parseFloat(line),
      overProbability: parseFloat(overProbability),
      participant: `Participant:${participantId}`,
      predictedAt: parseFloat(predictedAt),
      signature,
      statCategory
    };
  }
}

export default Store;
