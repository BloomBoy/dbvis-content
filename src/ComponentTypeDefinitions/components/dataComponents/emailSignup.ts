import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface EmailSignupFormData extends TailwindData {
  termsText: object;
  buttonText: string;
}

const EmailSignupForm = makeComponent<EmailSignupFormData>({
  name: 'Email Signup Form',
  subFields: {
    ...tailwindClassFields,
    termsText: 'RichText',
    buttonText: 'Symbol',
  },
});

export default EmailSignupForm;
