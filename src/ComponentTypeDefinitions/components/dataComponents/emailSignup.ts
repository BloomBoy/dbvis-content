import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface EmailSignupFormData extends TailwindData {
  termsText: object;
  buttonText: string;
  placeholderText: string;
}

const EmailSignupForm = makeComponent<EmailSignupFormData>({
  name: 'Email Signup Form',
  subFields: {
    ...tailwindClassFields,
    termsText: 'RichText',
    buttonText: 'Symbol',
    placeholderText: 'Symbol',
  },
});

export default EmailSignupForm;
