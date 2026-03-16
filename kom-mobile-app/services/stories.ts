import api from './api';

export const storiesService = {
  viewStory: async (storyId: string) => {
    return api.post(`/stories/${storyId}/view`);
  },

  likeStory: async (storyId: string) => {
    return api.post(`/stories/${storyId}/like`);
  },

  getComments: async (storyId: string) => {
    return api.get(`/stories/${storyId}/comments`);
  },

  addComment: async (storyId: string, text: string) => {
    return api.post(`/stories/${storyId}/comments`, { text });
  },
  
  deleteStory: async (storyId: string) => {
    return api.delete(`/stories/${storyId}`);
  }
};
