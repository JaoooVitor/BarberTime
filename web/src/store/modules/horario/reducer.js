import produce from 'immer';
import types from './types';

const INITIAL_STATE = {
  behavior: 'create', // create, update, read
  components: {
    confirmDelete: false,
    drawer: false,
    view: 'week',
  },
  form: {
    filtering: false,
    disabled: true,
    saving: false,
  },
  horario: {
    dias: [],
    inicio: '',
    fim: '',
    especialidades: [],
    colaboradores: [],
  },
  horarios: [],
  servicos: [],
  colaboradores: [],
};

function horario(state = INITIAL_STATE, action) {
  switch (action.type) {
    case types.UPDATE_HORARIO: {
      return produce(state, (draft) => {
        Object.assign(draft, action.payload); // Atualiza o estado com os valores do payload
      });
    }

    case types.RESET_HORARIO: {
      return produce(state, (draft) => {
        draft.horario = INITIAL_STATE.horario; // Reseta apenas o objeto 'horario' para seu estado inicial
      });
    }

    default:
      return state;
  }
}

export default horario;
