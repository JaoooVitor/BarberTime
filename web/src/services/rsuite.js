import { Notification } from 'rsuite';
import 'rsuite/dist/styles/rsuite-default.css'; // Ajuste o caminho se necessário

export const notification = (type, params) => {
  Notification[type](params);
};
