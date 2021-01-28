import { connect } from '@cerebral/react';
import { props } from 'cerebral';
import React from 'react';
import classNames from 'classnames';

export const BigHeader = connect(
  {
    text: props.text,
  },
  function BigHeader({ text }) {
    return (
      <>
        <div className={classNames('big-blue-header')}>
          <div className="grid-container">
            <h1 tabIndex="-1">{text}</h1>
          </div>
        </div>
      </>
    );
  },
);
