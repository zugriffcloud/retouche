<script lang="ts">
  export let edit: () => Promise<void>;
  export let publish: () => Promise<void>;

  let editing = false;
  let disabled = false;

  async function clicked() {
    if (!editing) {
      editing = true;
      await edit();
      return;
    }

    try {
      disabled = true;
      await publish();
    } catch (error) {
      disabled = false;
      throw error;
    }
  }
</script>

{#if !editing}
  <div class="shade"></div>
  <div class="container">
    <p>
      It might not be possible to make targeted changes, such as changing text,
      when previous targeted changes are not yet reflected but already
      published.
    </p>
    <div class="footer">
      <button on:click={clicked}>Edit</button>
    </div>
  </div>
{:else}
  <button class="publish" on:click={clicked} {disabled}>Publish</button>
{/if}

<style lang="scss">
  * {
    box-sizing: border-box;
  }

  div.shade {
    position: fixed;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    top: 0;
    left: 0;
  }

  div.container {
    position: fixed;
    bottom: 0;
    right: 0;
    max-width: 380px;
    width: calc(100% - 30px);
    margin: 15px;
    border-radius: 25px;
    background: #ffffff;
    box-shadow: 0 10px 10px 5px rgba(0, 0, 0, 0.05);
    padding: 25px 15px 15px;

    p {
      margin: 0;
      color: #000000;
    }

    div.footer {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -15px;
        width: calc(100% + 30px);
        height: calc(100% + 15px);
        background: #00000005;
        border-radius: 0 0 25px 25px;
        z-index: -1;
      }

      margin: 15px 0 0;
      padding: 15px 0 0;

      display: flex;
      justify-content: flex-end;
    }
  }

  button {
    padding: 7px 15px;
    border-radius: 100px;
    border: 1px solid #00000030;
    background: #ffffff;
    color: #000000;

    &:disabled {
      cursor: not-allowed;
      background: #eaeaea;
    }

    &.publish {
      position: fixed;
      bottom: 15px;
      right: 15px;
      z-index: 1000;
    }
  }
</style>
