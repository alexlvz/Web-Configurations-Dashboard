import { Component, HostListener } from '@angular/core';
import { XmlConverterService } from './Services/xml-converter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  constructor(public xmlConverter : XmlConverterService) { }
  
  title = 'Web-Configurations-Dashboard';

  @HostListener('window:beforeunload', ['$event'])
  
  handleClose($event) {
    if (this.xmlConverter.unsavedChanges)
    {
      $event.returnValue = false;
    }
  }
  
}


