import makeComponent from '../../../utils/makeComponent';

interface ReviewSourcesData {
  count: number;
}

const ReviewSources = makeComponent<ReviewSourcesData>({
  name: 'Review score website list',
  subFields: {
    count: {
      type: 'Integer',
      required: true,
    },
  },
});

export default ReviewSources;
