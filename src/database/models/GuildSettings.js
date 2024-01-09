const mongoose = require('mongoose');


const guildConfigSchema = mongoose.Schema({
  guildId: {
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true
  },

  prefix: {
    type: mongoose.SchemaTypes.String,
    required: true,
    default: '.',
  },
  

  suggestion: {

  suggestionChannelID: {
     type: mongoose.SchemaTypes.String,
     required: false,
     default: null
  },
  suggestioncolor: {
     type: mongoose.SchemaTypes.String,
     required: false,
     default: "#000000"
  },
  suggestionlogChannelID: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: null
  },
  decline: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: true,
  },
  deleteSuggestion: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: true,
  },
  description: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: `{suggestion}`
  },
  footer:{
    type: mongoose.SchemaTypes.String,
    required: false,
    default: `Suggested by {user}`
  },
  timestamp: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: false,
  },
  reaction: {
    type: mongoose.SchemaTypes.String,
    required: false,
    default: `1`,
  }

  },


});

module.exports = mongoose.model('guild', guildConfigSchema);