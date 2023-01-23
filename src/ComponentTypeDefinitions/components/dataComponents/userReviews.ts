import makeComponent from '../../../utils/makeComponent';

interface UserReviewsData {
  initialCount: number;
  maxCount?: number;
  onlyTags?: string[];
}

const UserReviews = makeComponent<UserReviewsData>({
  name: 'User Reviews Carousel',
  subFields: {
    initialCount: {
      type: 'Integer',
      required: true,
    },
    maxCount: {
      type: 'Integer',
      required: false,
    },
    onlyTags: {
      type: 'Array',
      required: false,
      items: {
        type: 'Symbol',
      },
    }
  },
});

export default UserReviews;
