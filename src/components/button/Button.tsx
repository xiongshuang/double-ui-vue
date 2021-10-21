import './index.styl';

import { defineComponent, PropType } from 'vue';

const Button = defineComponent({
    name: 'Button',
    props: {
        type: {
            type: String,
            default: 'default' // default blue word
        },
        size: {
            type: String,
            default: 'medium' // large medium small
        },
        disabled: {
            type: Boolean,
            default: false
        },
        width: {
            type: [String, Number],
            default: ''
        },
        htmlType: {
            type: String as PropType<'button' | 'submit' | 'reset' | undefined>,
            default: 'button'
        }
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
        const clickHandle = () => {
            emit('click');
        };

        return () => {
            const { type, size, disabled, width, htmlType } = props;
            return (
                <button
                    type={htmlType}
                    class={[
                        'm-button',
                        `m-button-${type}`,
                        `m-button-${size}`,
                        `m-button-${disabled ? 'disabled' : 'normal'}`
                    ]}
                    style={{ width: `${width}px` }}
                    onClick={clickHandle}
                >
                    <section class="m-button-content">
                        <span class="m-button-text">{slots.default && slots.default()}</span>
                    </section>
                </button>
            );
        };
    }
});

export default Button;
