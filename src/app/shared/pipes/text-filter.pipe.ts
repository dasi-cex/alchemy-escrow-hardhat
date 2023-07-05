import { Pipe, PipeTransform } from '@angular/core';
import { ContractRecord } from 'shared-models/contracts/contract-record.model';

@Pipe({
  name: 'textFilter'
})
export class TextFilterPipe implements PipeTransform {

  transform(value: ContractRecord[] | null, text: string): ContractRecord[] | null | undefined {
    if (!text) {
      return value;
    }

    const regex = new RegExp(text, 'gi');

    return value?.filter(item => regex.test(item.address));
  }

}