import {Directive, ElementRef, Inject, Input, OnChanges, OnInit, Renderer} from '@angular/core';

@Directive({
  selector: '[focus]'
})

export class FocusDirective implements OnChanges, OnInit {
  @Input() focus: boolean;

  constructor(
    @Inject(ElementRef) private element: ElementRef, 
    public renderer: Renderer
  ) {}

  ngOnInit() {
    this.renderer.invokeElementMethod(this.element.nativeElement,   'focus', []);
  }

  public ngOnChanges() {
    this.element.nativeElement.focus();
  }

} 