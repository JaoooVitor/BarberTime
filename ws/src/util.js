const moment = require('moment');

module.exports = {
    SLOT_DURATION: 30,
    isOpened: async (horarios) => {
        // Implementação da função isOpened
        // Por enquanto, retorna um exemplo de implementação
        return horarios.some(horario => {
            const now = moment();
            const start = moment(horario.startTime);
            const end = moment(horario.endTime);
            return now.isBetween(start, end, null, '[]');
        });
    },

    toCents: (price) => {
        // Converte o preço para centavos
        return parseInt(price.toString().replace('.', '').replace(',', ''));
    },
    hourToMinutes: (hourMinute) => {
        // 1:20
        const [hour, minutes] = hourMinute.split(':');
        return parseInt(parseInt(hour) * 60 + parseInt(minutes));
    },
    sliceMinutes: (start, end, duraction) => {
        const slices = []; // [1:30, 2:00, 3:00]
        let count = 0;

        //90 = 1:30
        start = moment(start);
        //180 = 3:00
        end = moment(end);

        while (end > start) {
            slices.push(start.format('HH:mm'));
            start = start.add(duraction, 'minutes');
            count++;
        }
        return slices;
    },
    mergeDateTime: (date, time) => {
        const merged = `${moment(date).format('YYYY-MM-DD')}T${moment(time).format(
          'HH:mm'
        )}`;
        //console.log(merged);
        return merged;
      },
      splitByValue: (array, value) => {
        let newArray = [[]];
        array.forEach((item) => {
          if (item !== value) {
            newArray[newArray.length - 1].push(item);
          } else {
            newArray.push([]);
          }
        });
        return newArray;
      },
};
